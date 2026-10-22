import pytest
from app.models.schemas import (
    Concept, ConceptDifficulty, Question, QuestionOption, AnswerSubmission,
    SupportSignal, ErrorTaxonomyCategory
)
from app.services.graph_service import graph_service
from app.services.diagnostic_service import diagnostic_service
from app.data.repository import repo
from app.data.curriculum import CONCEPTS
from app.api.routes import get_diagnostic_questions, get_reassessment_questions, submit_answer, get_students_summary

def test_answer_secrecy_before_submission():
    """
    Spec §7 & §20: Ensure student question-fetch endpoints NEVER leak
    correct answers, worked solutions, or option misconception explanations.
    """
    questions = get_diagnostic_questions()
    assert len(questions) > 0

    for q in questions:
        # Pydantic model dump
        data = q.model_dump()
        assert "correct_answer" not in data or data["correct_answer"] is None or not hasattr(q, "correct_answer"), \
            f"Question {q.id} leaked correct_answer before submission!"
        assert "worked_solution" not in data or data["worked_solution"] is None or not hasattr(q, "worked_solution"), \
            f"Question {q.id} leaked worked_solution before submission!"

        for opt in q.options:
            opt_data = opt.model_dump()
            assert "misconception_explanation" not in opt_data or opt_data.get("misconception_explanation") is None, \
                f"Option {opt.id} leaked misconception_explanation before submission!"

    reassess_questions = get_reassessment_questions()
    assert len(reassess_questions) > 0
    for q in reassess_questions:
        assert not hasattr(q, "correct_answer"), f"Reassessment {q.id} leaked correct answer!"

def test_prerequisite_graph_cycle_detection():
    """
    Spec §18.5 & §21: Validates that circular prerequisite dependencies
    are strictly detected by Tarjan/DFS 3-color graph validation.
    """
    # 1. Active curriculum has no cycles
    has_cycles, cycles = graph_service.detect_cycles(CONCEPTS)
    assert has_cycles is False
    assert len(cycles) == 0

    # 2. Artificially introduce a circular loop: A -> B -> C -> A
    cyclic_concepts = [
        Concept(id="node_a", name="Node A", description="", order=1, prerequisites=["node_c"]),
        Concept(id="node_b", name="Node B", description="", order=2, prerequisites=["node_a"]),
        Concept(id="node_c", name="Node C", description="", order=3, prerequisites=["node_b"]),
    ]
    has_cycles_err, detected_cycles = graph_service.detect_cycles(cyclic_concepts)
    assert has_cycles_err is True
    assert len(detected_cycles) > 0
    # Verify the loop path includes the cycle nodes
    flat_cycle = [node for cycle in detected_cycles for node in cycle]
    assert "node_a" in flat_cycle
    assert "node_b" in flat_cycle
    assert "node_c" in flat_cycle

def test_diagnostic_follow_up_question_triggering():
    """
    Spec §18.1, §19, & §21:
    - Ambiguous error triggers a targeted follow-up question.
    - Follow-up items NEVER trigger secondary follow-up items (loop prevention).
    - Correct answers NEVER trigger follow-up questions.
    """
    # Case 1: Initial ambiguous error on fraction addition
    sub = AnswerSubmission(
        student_id="student_alex",
        question_id="q_frac_like_01",
        student_answer="3/10",
        response_time_seconds=12.5
    )
    eval_result = submit_answer(sub)
    assert eval_result.is_correct is False
    assert eval_result.needs_follow_up is True
    assert eval_result.follow_up_question is not None
    assert eval_result.follow_up_question.id == "q_frac_like_01_diag_followup"
    assert eval_result.follow_up_question.is_follow_up is True

    # Case 2: Answering the follow-up question does NOT loop
    follow_up_sub = AnswerSubmission(
        student_id="student_alex",
        question_id="q_frac_like_01_diag_followup",
        student_answer="5/14",
        response_time_seconds=9.0
    )
    eval_follow_up = submit_answer(follow_up_sub)
    assert eval_follow_up.needs_follow_up is False
    assert eval_follow_up.follow_up_question is None

    # Case 3: Correct answer never triggers follow-up
    correct_sub = AnswerSubmission(
        student_id="student_alex",
        question_id="q_frac_like_01",
        student_answer="3/5",
        response_time_seconds=5.0
    )
    eval_correct = submit_answer(correct_sub)
    assert eval_correct.is_correct is True
    assert eval_correct.needs_follow_up is False
    assert eval_correct.follow_up_question is None

def test_fair_teacher_support_signals():
    """
    Spec §18.6: Verifies non-stigmatizing support signals ('Needs Support',
    'Monitoring', 'On Track', 'Insufficient Data') based on multi-factor evidence.
    """
    # Register test students with distinct profiles
    repo.users["stud_low_data"] = {"id": "stud_low_data", "name": "New Student", "role": "student", "grade": "8th"}
    repo.mastery_records["stud_low_data"] = {}

    repo.users["stud_high"] = {"id": "stud_high", "name": "High Achiever", "role": "student", "grade": "8th"}
    repo._init_student_mastery("stud_high", {"fractions_intro": 0.95, "linear_equations_1step": 0.90})
    for i in range(3):
        repo.record_attempt({
            "id": f"att_sh_{i}",
            "student_id": "stud_high",
            "concept_id": "fractions_intro",
            "is_correct": True,
            "created_at": "2026-10-20T10:00:00"
        })

    students = get_students_summary()
    stud_map = {s.student_id: s for s in students}

    # Student with 0 attempts must be labeled Insufficient Data
    assert stud_map["stud_low_data"].support_signal == SupportSignal.INSUFFICIENT_DATA
    assert "insufficient" in stud_map["stud_low_data"].evidence_summary.lower()

    # High mastery student must be labeled On Track
    assert stud_map["stud_high"].support_signal == SupportSignal.ON_TRACK
    assert "high mastery" in stud_map["stud_high"].evidence_summary.lower()

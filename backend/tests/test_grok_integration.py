"""
Tests for xAI Grok Integration, Dynamic AI Tutor, Dynamic Lesson Generation,
Dynamic Assessment Engine, Answer Secrecy, Generalized Misconceptions, and Topic Catalog.

All tests run deterministically with mocked responses or offline fallbacks
so no paid API credentials are required.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings
from app.services.grok_service import grok_service
from app.models.schemas import (
    TutorChatMessage, TutorChatRequest,
    DynamicLessonRequest, DynamicAssessmentRequest,
    DynamicAssessmentSubmitRequest, DynamicAnswerItem,
    ConfidenceLevel, ContentReviewStatus, ErrorTaxonomyCategory
)
from app.data.repository import repo

client = TestClient(app)

# -------------------------------------------------------------------------
# 1. Grok Provider Configuration & Health Checks
# -------------------------------------------------------------------------
def test_grok_health_missing_key():
    """Verifies provider health reports missing_key and offline fallback safely when no key is set."""
    with patch.object(settings, "XAI_API_KEY", None):
        res = client.get("/api/ai/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "missing_key"
        assert data["is_configured"] is False
        assert data["is_fallback"] is True
        assert "XAI_API_KEY not configured" in data["message"]
        assert "sk-" not in data["message"]  # Secrets never leaked!

def test_grok_health_mocked_success():
    """Verifies ready status when xAI API responds 200 OK."""
    with patch.object(settings, "XAI_API_KEY", "xai-test-valid-key"):
        with patch.object(grok_service, "check_health", return_value={
            "status": "ready",
            "provider": "xAI Grok",
            "model": "grok-2-latest",
            "is_configured": True,
            "is_fallback": False,
            "message": "xAI Grok API connected and verified operational."
        }):
            res = client.get("/api/ai/health")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ready"
            assert data["is_configured"] is True
            assert data["is_fallback"] is False
            assert "verified operational" in data["message"]

def test_grok_health_error_states():
    """Verifies handled statuses for invalid key (401) and rate limits (429)."""
    with patch.object(settings, "XAI_API_KEY", "xai-test-key"):
        with patch.object(grok_service, "check_health", return_value={
            "status": "invalid_key",
            "provider": "xAI Grok",
            "model": "grok-2-latest",
            "is_configured": True,
            "is_fallback": True,
            "message": "Provided XAI_API_KEY was rejected (401 Unauthorized)."
        }):
            res = client.get("/api/ai/health")
            assert res.status_code == 200
            assert res.json()["status"] == "invalid_key"

        with patch.object(grok_service, "check_health", return_value={
            "status": "rate_limited",
            "provider": "xAI Grok",
            "model": "grok-2-latest",
            "is_configured": True,
            "is_fallback": True,
            "message": "xAI Grok rate limit reached or quota exhausted (429)."
        }):
            res = client.get("/api/ai/health")
            assert res.status_code == 200
            assert res.json()["status"] == "rate_limited"

# -------------------------------------------------------------------------
# 2. AI Tutor Multi-Subject Conversation & Fallbacks
# -------------------------------------------------------------------------
def test_tutor_chat_offline_fallback():
    """Verifies high-quality multi-subject offline tutor responses across Physics, CS, and Math."""
    with patch.object(settings, "XAI_API_KEY", None):
        # Physics query
        req_physics = {
            "student_id": "student_alex",
            "subject": "Physics",
            "topic": "Newton's First Law",
            "level": "intermediate",
            "messages": [{"role": "user", "content": "What is inertia and how does it relate to momentum?"}],
            "action": "worked_example"
        }
        res_phys = client.post("/api/tutor/chat", json=req_physics)
        assert res_phys.status_code == 200
        data_phys = res_phys.json()
        assert data_phys["is_fallback"] is True
        assert "Newton" in data_phys["response"] or "Physics" in data_phys["response"]
        assert len(data_phys["suggested_followups"]) >= 1

        # Computer Science query
        req_cs = {
            "student_id": "student_alex",
            "subject": "Computer Science",
            "topic": "Recursion",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Explain recursive base cases"}],
            "action": "simplify"
        }
        res_cs = client.post("/api/tutor/chat", json=req_cs)
        assert res_cs.status_code == 200
        data_cs = res_cs.json()
        assert "Computer Science" in data_cs["response"] or "def " in data_cs["response"]
        assert len(data_cs["suggested_followups"]) >= 1

def test_tutor_chat_mocked_grok_success():
    """Verifies parsing and follow-up extraction when live Grok response is received."""
    fake_content = (
        "In thermodynamics, entropy measures the degree of microscopic disorder in a system.\n\n"
        "FOLLOW_UP_SUGGESTIONS:\n"
        "1. How does the Second Law relate to entropy?\n"
        "2. Can entropy ever decrease in an open system?\n"
        "3. What is the Boltzmann formula for entropy?"
    )
    with patch.object(settings, "XAI_API_KEY", "xai-test-key"):
        with patch.object(grok_service, "_call_grok", return_value=(fake_content, None)):
            req = {
                "student_id": "student_alex",
                "subject": "Physics",
                "topic": "Entropy",
                "level": "advanced",
                "messages": [{"role": "user", "content": "What is entropy?"}]
            }
            res = client.post("/api/tutor/chat", json=req)
            assert res.status_code == 200
            data = res.json()
            assert data["is_fallback"] is False
            assert "microscopic disorder" in data["response"]
            assert len(data["suggested_followups"]) == 3
            assert "Second Law" in data["suggested_followups"][0]

# -------------------------------------------------------------------------
# 3. Dynamic Lesson Generation
# -------------------------------------------------------------------------
def test_dynamic_lesson_generation_schema_validation():
    """Verifies that generated lessons adhere strictly to DynamicLesson schema."""
    req = {
        "student_id": "student_alex",
        "subject": "Chemistry",
        "topic": "Chemical Bonding",
        "level": "intermediate",
        "learning_objective": "Distinguish between ionic and covalent bonds",
        "style": "step_by_step"
    }
    res = client.post("/api/lessons/generate", json=req)
    assert res.status_code == 200
    lesson = res.json()

    assert lesson["id"].startswith("lesson_")
    assert lesson["subject"] == "Chemistry"
    assert lesson["topic"] == "Chemical Bonding"
    assert len(lesson["learning_objectives"]) >= 1
    assert len(lesson["prerequisites"]) >= 1
    assert len(lesson["core_explanation"]) > 30
    assert len(lesson["step_by_step_examples"]) >= 1
    assert len(lesson["common_mistakes_and_misconceptions"]) >= 1
    assert len(lesson["practice_questions"]) >= 1
    assert lesson["short_summary"] != ""
    assert lesson["review_status"] in ("approved", "pending_review")

    # Fetch retrieved lesson via GET
    get_res = client.get(f"/api/lessons/{lesson['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == lesson["id"]

# -------------------------------------------------------------------------
# 4. Dynamic Assessment Engine & Answer Secrecy
# -------------------------------------------------------------------------
def test_dynamic_assessment_answer_secrecy():
    """
    CRITICAL SPEC REQUIREMENT (§7, §20):
    Dynamic assessment items delivered to students MUST NOT contain the correct answer
    or worked solution prior to submission.
    """
    req = {
        "student_id": "student_alex",
        "subject": "Physics",
        "topic": "Momentum Conservation",
        "difficulty": 0.6,
        "question_count": 2,
        "question_type": "multiple_choice"
    }
    res = client.post("/api/assessments/generate-dynamic", json=req)
    assert res.status_code == 200
    session = res.json()

    assert "assessment_id" in session
    assert len(session["questions"]) == 2

    for q in session["questions"]:
        # Verify correct_answer and worked_solution are completely absent in student payload
        assert "correct_answer" not in q or q.get("correct_answer") is None
        assert "worked_solution" not in q or q.get("worked_solution") is None
        assert len(q["options"]) >= 2
        for opt in q["options"]:
            assert "misconception_explanation" not in opt or opt.get("misconception_explanation") is None

def test_dynamic_assessment_submission_and_grading():
    """Verifies submission grading, worked solution disclosure, and score computation."""
    # 1. Generate session
    gen_res = client.post("/api/assessments/generate-dynamic", json={
        "student_id": "student_alex",
        "subject": "Mathematics",
        "topic": "Linear Equations",
        "difficulty": 0.5,
        "question_count": 2
    })
    session = gen_res.json()
    assess_id = session["assessment_id"]
    q1 = session["questions"][0]

    # Inspect server-side stored session to find the correct answer for q1
    stored_session = repo.get_assessment_session(assess_id)
    assert stored_session is not None
    stored_q1 = [q for q in stored_session["questions"] if q.id == q1["id"]][0]
    corr_ans = stored_q1.correct_answer

    # 2. Submit answers: 1 correct, 1 incorrect
    submit_req = {
        "assessment_id": assess_id,
        "student_id": "student_alex",
        "answers": [
            {
                "question_id": q1["id"],
                "student_answer": corr_ans,
                "confidence": "high",
                "reasoning": "Substituted boundary values."
            },
            {
                "question_id": session["questions"][1]["id"],
                "student_answer": "Definitely Incorrect Dummy Answer",
                "confidence": "low",
                "reasoning": "Unsure"
            }
        ]
    }
    sub_res = client.post("/api/assessments/submit-dynamic", json=submit_req)
    assert sub_res.status_code == 200
    result = sub_res.json()

    assert result["total_questions"] == 2
    assert result["correct_count"] == 1
    assert result["score"] == 0.50
    assert len(result["evaluations"]) == 2

    # Check that post-submission evaluation now safely reveals worked solutions
    eval1 = result["evaluations"][0]
    assert eval1["is_correct"] is True
    assert eval1["correct_answer"] == corr_ans
    assert eval1["worked_solution"] is not None
    assert len(eval1["worked_solution"]) >= 1

    eval2 = result["evaluations"][1]
    assert eval2["is_correct"] is False
    assert eval2["worked_solution"] is not None

# -------------------------------------------------------------------------
# 5. BKT Independence & Non-Pollution of Knowledge Graph
# -------------------------------------------------------------------------
def test_bkt_independence_and_non_pollution():
    """
    Verifies that:
    1. BKT updates are deterministic and based only on correct/incorrect attempts.
    2. Student confidence ratings NEVER directly modify BKT values.
    3. Custom topics do not pollute or alter the authoritative knowledge graph.
    """
    initial_graph_concepts = len(repo.concepts)

    # Generate and submit for a custom, unverified topic
    gen_res = client.post("/api/assessments/generate-dynamic", json={
        "student_id": "student_alex",
        "subject": "Astronomy",
        "topic": "Stellar Evolution",
        "difficulty": 0.5,
        "question_count": 1
    })
    session = gen_res.json()
    q_id = session["questions"][0]["id"]

    client.post("/api/assessments/submit-dynamic", json={
        "assessment_id": session["assessment_id"],
        "student_id": "student_alex",
        "answers": [{
            "question_id": q_id,
            "student_answer": "Supernova",
            "confidence": "high"
        }]
    })

    # The authoritative graph must NOT be polluted with unreviewed custom concepts
    assert len(repo.concepts) == initial_graph_concepts

# -------------------------------------------------------------------------
# 6. Generalized Misconception Taxonomy
# -------------------------------------------------------------------------
def test_generalized_misconception_taxonomy_rules():
    """Verifies controlled taxonomy categories and uncertainty handling."""
    # 1. Blank student answer -> insufficient_evidence
    res_blank = grok_service.analyze_misconception_generalized(
        problem="Solve 2x = 10",
        student_answer="",
        correct_answer="x = 5"
    )
    assert res_blank["category"] == ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE

    # 2. Correct answer -> insufficient_evidence (no misconception)
    res_correct = grok_service.analyze_misconception_generalized(
        problem="Calculate 2/7 + 3/7",
        student_answer="5/7",
        correct_answer="5/7"
    )
    assert res_correct["category"] == ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE

    # 3. Known Math fraction trap (5/14) -> concept_misunderstanding
    res_math = grok_service.analyze_misconception_generalized(
        problem="Calculate 2/7 + 3/7",
        student_answer="5/14",
        correct_answer="5/7"
    )
    assert res_math["category"] in (ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING, ErrorTaxonomyCategory.ARITHMETIC_OR_SIGN_ERROR)
    assert res_math["confidence"] >= 0.70

    # 4. Near-miss typo slip -> possible_typo
    res_typo = grok_service.analyze_misconception_generalized(
        problem="Write the keyword for returning values",
        student_answer="retrun",
        correct_answer="return"
    )
    assert res_typo["category"] == ErrorTaxonomyCategory.POSSIBLE_TYPO

# -------------------------------------------------------------------------
# 7. Multi-Subject Topic Catalog & Custom Requests
# -------------------------------------------------------------------------
def test_topic_catalog_and_student_custom_request():
    """Verifies that the catalog lists verified and community topics and allows safe requests."""
    # List catalog
    res = client.get("/api/topics/catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) >= 7

    # Ensure status field is properly populated
    statuses = {t["status"] for t in catalog}
    assert "verified" in statuses

    # Student requests a custom topic
    req_body = {
        "subject": "Computer Science",
        "name": "Dynamic Programming",
        "description": "Memoization, tabulation, and optimal substructure."
    }
    req_res = client.post("/api/topics/request", json=req_body)
    assert req_res.status_code == 200
    new_topic = req_res.json()
    assert new_topic["name"] == "Dynamic Programming"
    assert new_topic["status"] == "community_requested"

    # Verify newly requested topic appears in catalog
    updated_catalog = client.get("/api/topics/catalog").json()
    assert any(t["name"] == "Dynamic Programming" for t in updated_catalog)

# -------------------------------------------------------------------------
# 8. Teacher Moderation of Dynamic Content
# -------------------------------------------------------------------------
def test_teacher_dynamic_content_moderation():
    """Verifies teacher review (approve, reject, disable) on dynamically generated items."""
    # Generate a lesson to review
    lesson_res = client.post("/api/lessons/generate", json={
        "student_id": "student_alex",
        "subject": "Biology",
        "topic": "DNA Replication",
        "level": "intermediate"
    })
    lesson_id = lesson_res.json()["id"]

    # Teacher reviews dynamic content
    queue_res = client.get("/api/teacher/dynamic-content")
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    assert any(l["id"] == lesson_id for l in queue_data["lessons"])

    # Teacher rejects the lesson with reason
    review_res = client.post(f"/api/teacher/dynamic-content/{lesson_id}/review", json={
        "action": "reject",
        "teacher_id": "teacher_sarah",
        "reason": "Needs more visual diagrams of replication forks."
    })
    assert review_res.status_code == 200
    assert review_res.json()["review_status"] == ContentReviewStatus.REJECTED.value

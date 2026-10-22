"""
Regression and Integration Tests for Local Testing Issues:
A. Accurate Recovery Score (no 100% false recovery before reassessment, honest handling of failed reassessments and zero baselines)
B. Concept & Misconception Alignment (no cross-concept leakage like equation sign reversal in fraction questions)
C. Reassessment Flow Persistence & Integrity
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from app.data.repository import repo
from app.services.recovery_engine import recovery_engine
from app.services.ai_service import ai_service
from app.models.schemas import AnswerSubmission

client = TestClient(app)

def test_fraction_grading_correct_and_incorrect():
    """Verify that 5/6 is graded as correct and 1/6 is graded as incorrect for 1/2 + 1/3."""
    # Test incorrect submission (1/6)
    sub_wrong = AnswerSubmission(
        student_id="test_student_frac",
        question_id="q_frac_unlike_01",
        student_answer="1/6",
        response_time_seconds=6.5
    )
    res_wrong = client.post("/api/diagnostic/submit", json=sub_wrong.model_dump())
    assert res_wrong.status_code == 200
    data_wrong = res_wrong.json()
    assert data_wrong["is_correct"] is False
    assert data_wrong["detected_misconception"] == "cross_multiply_in_addition"
    assert "cross-multiplication" in data_wrong["misconception_explanation"].lower() or "denominators" in data_wrong["misconception_explanation"].lower()

    # Test correct submission (5/6)
    sub_correct = AnswerSubmission(
        student_id="test_student_frac",
        question_id="q_frac_unlike_01",
        student_answer="5/6",
        response_time_seconds=7.0
    )
    res_correct = client.post("/api/diagnostic/submit", json=sub_correct.model_dump())
    assert res_correct.status_code == 200
    data_correct = res_correct.json()
    assert data_correct["is_correct"] is True
    assert data_correct["detected_misconception"] is None

def test_recovery_score_no_post_reassessment():
    """Never report recovery before a valid fresh reassessment."""
    # Student failed pre-assessment (0.0) but has not taken post-reassessment
    report = recovery_engine.calculate_recovery_score(
        student_id="student_test_recovery",
        concept_id="fraction_addition_unlike",
        pre_scores=[0.0],
        post_scores=[]
    )
    assert report.baseline_attempts == 1
    assert report.post_attempts == 0
    assert report.recovery_percentage == 0.0
    assert report.status == "Awaiting Reassessment"
    assert "baseline diagnostic recorded" in report.disclaimer.lower()

def test_recovery_score_incorrect_reassessment_no_false_recovery():
    """Never count an incorrect reassessment answer as successful recovery."""
    # Student scored 0.0 in pre-assessment and 0.0 in post-reassessment
    report = recovery_engine.calculate_recovery_score(
        student_id="student_test_recovery",
        concept_id="fraction_addition_unlike",
        pre_scores=[0.0],
        post_scores=[0.0]
    )
    assert report.baseline_attempts == 1
    assert report.post_attempts == 1
    assert report.recovery_percentage == 0.0
    assert report.status == "Needs Further Practice"
    assert "fraction_addition_unlike" in report.remaining_gaps or "Adding Fractions (Unlike Denominators)" in report.remaining_gaps
    assert len(report.concepts_improved) == 0

def test_recovery_score_successful_fresh_reassessment():
    """Report recovery honestly when a valid fresh reassessment shows improvement."""
    report = recovery_engine.calculate_recovery_score(
        student_id="student_test_recovery",
        concept_id="fraction_addition_unlike",
        pre_scores=[0.0],
        post_scores=[1.0]
    )
    assert report.baseline_attempts == 1
    assert report.post_attempts == 1
    assert report.recovery_percentage == 100.0
    assert report.status == "Significant Recovery"
    assert len(report.concepts_improved) == 1

def test_recovery_score_zero_baseline_and_empty_state():
    """Handle zero baselines and missing data honestly."""
    report = recovery_engine.calculate_recovery_score(
        student_id="student_test_empty",
        concept_id="fraction_addition_unlike",
        pre_scores=[],
        post_scores=[]
    )
    assert report.baseline_attempts == 0
    assert report.post_attempts == 0
    assert report.recovery_percentage == 0.0
    assert report.status == "No Assessment Data"

def test_recommendation_concept_alignment_no_mismatch():
    """Verify recommendation matches the focal concept and does not leak cross-concept explanations."""
    # Request recommendation specifically for fraction_addition_unlike using target_concept_id
    res = client.get("/api/recommendations/next?student_id=student_alex&target_concept_id=fraction_addition_unlike")
    assert res.status_code == 200
    rec = res.json()
    
    # Must be for fraction addition or a legitimate prerequisite of fraction addition (e.g. fraction_addition_like)
    assert "fraction" in rec["concept_id"] or "fraction" in rec["concept_title"].lower()
    
    # Must NOT mention equation isolation or sign reversal!
    assert "sign reversal" not in rec["explanation"].lower()
    assert "equation isolation" not in rec["explanation"].lower()
    assert "2x" not in rec["explanation"]

def test_targeted_generator_concept_misconception_alignment():
    """Verify that generating a question for fraction_addition_unlike never returns an equation question."""
    # Even if an incompatible misconception like sign_flip_omission was requested, generator aligns to concept
    q = ai_service.generate_targeted_question(
        concept_id="fraction_addition_unlike",
        misconception_id="sign_flip_omission",
        difficulty=0.5
    )
    assert q.concept_id == "fraction_addition_unlike"
    assert "/" in q.prompt or "fraction" in q.prompt.lower()
    assert "solve for y" not in q.prompt.lower()
    assert "x" not in q.prompt.lower()

def test_end_to_end_reassessment_lifecycle():
    """Verify full end-to-end flow: pre-assessment error -> awaiting reassessment -> reassessment success -> recovery."""
    test_sid = "student_lifecycle_test"
    
    # Step 1: Pre-assessment answer submitted (incorrect: 1/6)
    sub1 = AnswerSubmission(
        student_id=test_sid,
        question_id="q_frac_unlike_01",
        student_answer="1/6",
        response_time_seconds=8.0,
        is_reassessment=False
    )
    res1 = client.post("/api/diagnostic/submit", json=sub1.model_dump())
    assert res1.status_code == 200
    assert res1.json()["is_correct"] is False
    
    # Step 2: Check recovery score before reassessment
    score_res1 = client.get(f"/api/recovery/score?student_id={test_sid}&concept_id=fraction_addition_unlike")
    assert score_res1.status_code == 200
    s_data1 = score_res1.json()
    assert s_data1["post_attempts"] == 0
    assert s_data1["recovery_percentage"] == 0.0
    assert s_data1["status"] == "Awaiting Reassessment"
    
    # Step 3: Reassessment answer submitted (correct: 5/6)
    sub2 = AnswerSubmission(
        student_id=test_sid,
        question_id="q_frac_unlike_01",
        student_answer="5/6",
        response_time_seconds=6.0,
        is_reassessment=True
    )
    res2 = client.post("/api/diagnostic/submit", json=sub2.model_dump())
    assert res2.status_code == 200
    assert res2.json()["is_correct"] is True
    
    # Step 4: Check recovery score after reassessment
    score_res2 = client.get(f"/api/recovery/score?student_id={test_sid}&concept_id=fraction_addition_unlike")
    assert score_res2.status_code == 200
    s_data2 = score_res2.json()
    assert s_data2["baseline_attempts"] >= 1
    assert s_data2["post_attempts"] == 1
    assert s_data2["recovery_percentage"] == 100.0
    assert s_data2["status"] == "Significant Recovery"

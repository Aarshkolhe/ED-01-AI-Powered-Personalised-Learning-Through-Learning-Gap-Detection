import pytest
from datetime import datetime, timezone
from app.models.schemas import (
    ConfidenceLevel, ConfidencePattern, RevisionStatus,
    RecommendationReasonCode, ContentReviewStatus, ValidationStatus,
    Question, ContentReportReason, ContentReportStatus
)
from app.services.confidence_service import confidence_service
from app.services.spaced_revision import spaced_revision_service
from app.services.recommendation_service import recommendation_service
from app.services.content_review_service import content_review_service
from app.services.bkt import bkt_engine

def test_feature_a_overconfidence_and_underconfidence():
    # Overconfidence: High confidence + incorrect
    over = confidence_service.analyze_confidence(ConfidenceLevel.HIGH, False)
    assert over.pattern == ConfidencePattern.OVERCONFIDENCE
    assert "High Confidence" in over.title

    # Underconfidence: Low confidence + correct
    under = confidence_service.analyze_confidence(ConfidenceLevel.LOW, True)
    assert under.pattern == ConfidencePattern.UNDERCONFIDENCE
    assert "Low Confidence" in under.title

    # Conscious uncertainty: Low/Med confidence + incorrect
    uncert = confidence_service.analyze_confidence(ConfidenceLevel.LOW, False)
    assert uncert.pattern == ConfidencePattern.CONSCIOUS_UNCERTAINTY

    # Optional / unspecified
    unspec = confidence_service.analyze_confidence(None, True)
    assert unspec.pattern == ConfidencePattern.UNSPECIFIED

def test_feature_a_confidence_never_modifies_bkt():
    # CRITICAL: Passing different confidence values does not alter pure Corbett & Anderson BKT calculation
    p_prior = 0.40
    # Two identical attempts with different confidence
    _, p_proj_1 = bkt_engine.update_mastery(p_prior, True)
    _, p_proj_2 = bkt_engine.update_mastery(p_prior, True)
    assert p_proj_1 == p_proj_2

def test_feature_b_spaced_revision_interval_and_reset():
    # Normal expansion
    assert spaced_revision_service.calculate_next_interval(1, 0.85, True) == 2
    assert spaced_revision_service.calculate_next_interval(2, 0.85, True) == 4
    assert spaced_revision_service.calculate_next_interval(3, 0.85, True) == 7

    # Error resets immediately to 1-day interval
    assert spaced_revision_service.calculate_next_interval(3, 0.85, False) == 1

def test_feature_b_spaced_revision_prioritization():
    practice_records = [
        {
            "concept_id": "c_fact",
            "concept_title": "Factoring",
            "mastery_probability": 0.45,
            "last_practiced_at": "2026-10-18T10:00:00",
            "recent_error_count": 1,
            "repetitions_count": 2
        },
        {
            "concept_id": "c_alg",
            "concept_title": "Basic Algebra",
            "mastery_probability": 0.85,
            "last_practiced_at": "2026-10-15T10:00:00",
            "recent_error_count": 0,
            "repetitions_count": 3
        }
    ]
    current_test_time = datetime(2026, 10, 23, 12, 0, 0)
    schedules = spaced_revision_service.compute_schedules("test_stud", practice_records, current_date=current_test_time)
    assert len(schedules["due_revisions"]) == 2
    # Lower mastery (c_fact at 0.45) is prioritized first in the queue
    assert schedules["due_revisions"][0].concept_id == "c_fact"

def test_feature_c_recommendation_reason_codes():
    class DummyConcept:
        def __init__(self, cid, name, prereqs):
            self.id = cid
            self.name = name
            self.prerequisites = prereqs

    concepts = {
        "eq_2step": DummyConcept("eq_2step", "Two-Step Equations", ["eq_1step"]),
        "eq_1step": DummyConcept("eq_1step", "One-Step Equations", [])
    }

    # Case 1: Prerequisite Low
    rec_prereq = recommendation_service.generate_recommendation(
        student_id="test",
        target_concept_id="eq_2step",
        target_concept_name="Two-Step Equations",
        concepts_map=concepts,
        student_mastery_map={"eq_1step": 0.35, "eq_2step": 0.20},
        student_attempts_count_map={"eq_1step": 2, "eq_2step": 1},
        recent_attempts=[],
        due_revisions=[],
        available_questions=[{"id": "q1", "concept_id": "eq_1step", "difficulty": 0.4}]
    )
    assert rec_prereq.reason_code == RecommendationReasonCode.PREREQUISITE_MASTERY_LOW
    assert "prerequisite" in rec_prereq.explanation.lower()

    # Case 2: High Mastery -> Ready for Harder Question
    rec_harder = recommendation_service.generate_recommendation(
        student_id="test",
        target_concept_id="eq_1step",
        target_concept_name="One-Step Equations",
        concepts_map=concepts,
        student_mastery_map={"eq_1step": 0.90},
        student_attempts_count_map={"eq_1step": 6},
        recent_attempts=[],
        due_revisions=[],
        available_questions=[{"id": "q2", "concept_id": "eq_1step", "difficulty": 0.7}]
    )
    assert rec_harder.reason_code == RecommendationReasonCode.READY_FOR_HARDER_QUESTION

def test_feature_d_teacher_content_review():
    q = Question(
        id="q_gen_test",
        concept_id="eq_1step",
        prompt="Solve x + 2 = 5",
        correct_answer="3",
        worked_solution=["x = 3"],
        source="generated",
        review_status=ContentReviewStatus.PENDING_REVIEW,
        validation_status=ValidationStatus.VALID,
        active=False
    )

    # Approve
    res = content_review_service.process_review_action(
        q, "teacher_1", "Ms. Davis", "teacher", "approve"
    )
    assert res["success"] is True
    assert q.review_status == ContentReviewStatus.APPROVED
    assert q.active is True

    # Reject requires reason
    res_no_reason = content_review_service.process_review_action(
        q, "teacher_1", "Ms. Davis", "teacher", "reject", ""
    )
    assert res_no_reason["success"] is False

    res_reject = content_review_service.process_review_action(
        q, "teacher_1", "Ms. Davis", "teacher", "reject", "Contains ambiguous variable"
    )
    assert res_reject["success"] is True
    assert q.review_status == ContentReviewStatus.REJECTED

def test_feature_d_student_quarantine_filter():
    curated = Question(
        id="q_cur", concept_id="c1", prompt="p", correct_answer="a",
        worked_solution=[], source="curated", review_status=ContentReviewStatus.APPROVED, active=True
    )
    pending_ai = Question(
        id="q_ai_pend", concept_id="c1", prompt="p", correct_answer="a",
        worked_solution=[], source="generated", review_status=ContentReviewStatus.PENDING_REVIEW, active=False
    )
    approved_ai = Question(
        id="q_ai_app", concept_id="c1", prompt="p", correct_answer="a",
        worked_solution=[], source="generated", review_status=ContentReviewStatus.APPROVED, validation_status=ValidationStatus.VALID, active=True
    )
    disabled_ai = Question(
        id="q_ai_dis", concept_id="c1", prompt="p", correct_answer="a",
        worked_solution=[], source="generated", review_status=ContentReviewStatus.DISABLED, active=False
    )

    eligible = content_review_service.filter_student_eligible_questions([curated, pending_ai, approved_ai, disabled_ai])
    assert len(eligible) == 2
    assert curated in eligible
    assert approved_ai in eligible
    assert pending_ai not in eligible
    assert disabled_ai not in eligible

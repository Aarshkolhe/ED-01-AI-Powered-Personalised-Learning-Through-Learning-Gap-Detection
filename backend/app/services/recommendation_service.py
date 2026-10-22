from typing import List, Dict, Any, Optional
from app.models.schemas import Recommendation, RecommendationReasonCode, RevisionSchedule

class RecommendationService:
    """
    Feature C — Explainable Recommendations.
    Generates explainable learning recommendations with structured reason codes.
    """

    @staticmethod
    def generate_recommendation(
        student_id: str,
        target_concept_id: str,
        target_concept_name: str,
        concepts_map: Dict[str, Any],
        student_mastery_map: Dict[str, float],
        student_attempts_count_map: Dict[str, int],
        recent_attempts: List[Dict[str, Any]],
        due_revisions: List[RevisionSchedule],
        available_questions: List[Dict[str, Any]]
    ) -> Recommendation:
        # Rule 1: Spaced Review Due
        if due_revisions:
            highest_priority = due_revisions[0]
            matching_q = next((q for q in available_questions if q.get("concept_id") == highest_priority.concept_id), None)
            return Recommendation(
                activity_type="spaced_revision",
                concept_id=highest_priority.concept_id,
                concept_title=highest_priority.concept_title,
                question_id=matching_q.get("id") if matching_q else None,
                reason_code=RecommendationReasonCode.SPACED_REVIEW_DUE,
                explanation=f"Time for a quick refresher on {highest_priority.concept_title}. Regular spaced practice prevents forgetting and keeps your mastery sharp.",
                evidence_summary=highest_priority.recommendation_rationale
            )

        # Rule 2: Prerequisite Mastery Low
        concept = concepts_map.get(target_concept_id)
        if concept and hasattr(concept, "prerequisites"):
            for prereq_id in concept.prerequisites:
                prereq_mastery = student_mastery_map.get(prereq_id, 0.20)
                prereq_attempts = student_attempts_count_map.get(prereq_id, 0)
                if prereq_mastery < 0.60 or prereq_attempts == 0:
                    prereq_concept = concepts_map.get(prereq_id)
                    prereq_title = prereq_concept.name if prereq_concept else prereq_id
                    matching_q = next((q for q in available_questions if q.get("concept_id") == prereq_id), None)
                    pct = round(prereq_mastery * 100)
                    return Recommendation(
                        activity_type="prerequisite_review",
                        concept_id=prereq_id,
                        concept_title=prereq_title,
                        question_id=matching_q.get("id") if matching_q else None,
                        reason_code=RecommendationReasonCode.PREREQUISITE_MASTERY_LOW,
                        explanation=f"Before continuing with {target_concept_name}, reviewing the prerequisite '{prereq_title}' (current mastery: {pct}%) will give you the foundation needed to succeed.",
                        evidence_summary=f"Prerequisite '{prereq_title}' mastery is {pct}%, below the readiness threshold of 60%."
                    )

        # Rule 3: Recent Error Pattern
        target_errors = [
            a for a in recent_attempts
            if a.get("concept_id") == target_concept_id and not a.get("is_correct", False)
        ]
        if target_errors:
            latest = target_errors[-1]
            m_name = latest.get("misconception_name") or "identified error pattern"
            matching_q = next((q for q in available_questions if q.get("concept_id") == target_concept_id and q.get("difficulty", 0.5) <= 0.4), None)
            return Recommendation(
                activity_type="lesson",
                concept_id=target_concept_id,
                concept_title=target_concept_name,
                question_id=matching_q.get("id") if matching_q else None,
                reason_code=RecommendationReasonCode.RECENT_ERROR_PATTERN,
                explanation=f"Let's focus on a targeted worked example. Recent responses indicated a potential confusion ({m_name}).",
                evidence_summary=f"Identified error pattern: '{m_name}' on recent practice."
            )

        # Rule 4: Mastery Uncertain
        current_mastery = student_mastery_map.get(target_concept_id, 0.20)
        attempts_count = student_attempts_count_map.get(target_concept_id, 0)
        if attempts_count < 3 or (0.35 <= current_mastery < 0.75):
            matching_q = next((q for q in available_questions if q.get("concept_id") == target_concept_id), None)
            pct = round(current_mastery * 100)
            return Recommendation(
                activity_type="question",
                concept_id=target_concept_id,
                concept_title=target_concept_name,
                question_id=matching_q.get("id") if matching_q else None,
                reason_code=RecommendationReasonCode.MASTERY_UNCERTAIN,
                explanation=f"More practice on {target_concept_name} is recommended so our learning engine can accurately calibrate your progress.",
                evidence_summary=f"Only {attempts_count} attempts recorded; mastery currently estimated at {pct}%."
            )

        # Rule 5: Ready for Harder Question
        if current_mastery >= 0.75:
            harder_q = next((q for q in available_questions if q.get("concept_id") == target_concept_id and q.get("difficulty", 0.5) >= 0.6), None)
            pct = round(current_mastery * 100)
            return Recommendation(
                activity_type="question",
                concept_id=target_concept_id,
                concept_title=target_concept_name,
                question_id=harder_q.get("id") if harder_q else None,
                reason_code=RecommendationReasonCode.READY_FOR_HARDER_QUESTION,
                explanation=f"Outstanding progress! With {pct}% mastery on {target_concept_name}, you are ready to tackle a more advanced challenge.",
                evidence_summary=f"Demonstrated strong consistent performance over {attempts_count} attempts."
            )

        # Default fallback
        return Recommendation(
            activity_type="question",
            concept_id=target_concept_id,
            concept_title=target_concept_name,
            reason_code=RecommendationReasonCode.MASTERY_UNCERTAIN,
            explanation=f"Continue practice on {target_concept_name} to build your skills.",
            evidence_summary="Baseline curriculum practice."
        )

recommendation_service = RecommendationService()

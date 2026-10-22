from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import Question, ContentReviewStatus, ValidationStatus, UserRole

class ContentReviewService:
    """
    Feature D — Teacher Review of AI-Generated Content.
    Safe review workflow and quality gate for generated questions.
    """

    @staticmethod
    def process_review_action(
        question: Question,
        reviewer_id: str,
        reviewer_name: str,
        reviewer_role: str,
        action: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        # Role-based check: Only teachers or admins
        if reviewer_role.lower() not in ("teacher", "admin"):
            return {
                "success": False,
                "error": "Unauthorized: Only teachers and administrators can review educational content."
            }

        prev_status = question.review_status
        new_status = prev_status

        if action == "approve":
            if question.validation_status == ValidationStatus.INVALID:
                return {
                    "success": False,
                    "error": "Cannot approve question that failed validation. Validation errors must be resolved first."
                }
            new_status = ContentReviewStatus.APPROVED
            question.active = True
        elif action == "reject":
            if not reason or not reason.strip():
                return {
                    "success": False,
                    "error": "Rejection requires a documented pedagogical or accuracy reason."
                }
            new_status = ContentReviewStatus.REJECTED
            question.active = False
            question.rejection_reason = reason.strip()
        elif action == "disable":
            new_status = ContentReviewStatus.DISABLED
            question.active = False
        elif action == "request_review":
            new_status = ContentReviewStatus.PENDING_REVIEW
        else:
            return {
                "success": False,
                "error": f"Invalid review action: {action}"
            }

        now = datetime.now(timezone.utc).isoformat()
        question.review_status = new_status
        question.reviewed_by = reviewer_id
        question.reviewed_at = now

        history_entry = {
            "id": f"rev_{question.id}_{int(datetime.now(timezone.utc).timestamp())}",
            "question_id": question.id,
            "reviewer_id": reviewer_id,
            "reviewer_name": reviewer_name,
            "previous_status": prev_status,
            "new_status": new_status,
            "reason": reason,
            "timestamp": now
        }

        return {
            "success": True,
            "previous_status": prev_status,
            "new_status": new_status,
            "history_entry": history_entry
        }

    @staticmethod
    def filter_student_eligible_questions(questions: List[Question]) -> List[Question]:
        """
        Enforces quality gate:
        - Curated questions are safe unless explicitly disabled.
        - AI-generated questions MUST be approved and valid to be served to students.
        """
        eligible = []
        for q in questions:
            if not q.active:
                continue
            if q.source == "curated":
                if q.review_status != ContentReviewStatus.DISABLED:
                    eligible.append(q)
            elif q.source == "generated":
                if q.review_status == ContentReviewStatus.APPROVED and q.validation_status == ValidationStatus.VALID:
                    eligible.append(q)
        return eligible

content_review_service = ContentReviewService()

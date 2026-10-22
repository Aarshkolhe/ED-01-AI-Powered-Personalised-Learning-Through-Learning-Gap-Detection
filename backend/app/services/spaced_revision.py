from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta, timezone
from app.models.schemas import RevisionSchedule, RevisionStatus

class SpacedRevisionService:
    """
    Feature B — Spaced Revision and Intelligent Practice Scheduling.
    Implements transparent MVP spaced repetition scheduling based on mastery,
    recency, and error history.
    """

    @staticmethod
    def calculate_next_interval(
        repetitions_count: int,
        mastery_probability: float,
        last_attempt_correct: bool
    ) -> int:
        # Upon an error, immediately reset to 1-day short-interval reinforcement
        if not last_attempt_correct:
            return 1

        if mastery_probability < 0.50:
            return 1
        elif mastery_probability < 0.75:
            if repetitions_count <= 1:
                return 1
            elif repetitions_count == 2:
                return 2
            return 4
        else:
            # High mastery (>= 0.75)
            if repetitions_count <= 1:
                return 2
            elif repetitions_count == 2:
                return 4
            elif repetitions_count == 3:
                return 7
            elif repetitions_count == 4:
                return 14
            return 30

    @staticmethod
    def generate_rationale(
        concept_title: str,
        days_since_practice: int,
        mastery_probability: float,
        is_overdue: bool,
        recent_error_count: int
    ) -> str:
        mastery_pct = round(mastery_probability * 100)

        if recent_error_count > 0:
            return f"Recent mistakes were detected in {concept_title} (mastery {mastery_pct}%). Early review prevents misconceptions from cementing."

        if is_overdue:
            unit = "day" if days_since_practice == 1 else "days"
            return f"Last practiced {days_since_practice} {unit} ago. Revision is due to counteract memory decay (current mastery: {mastery_pct}%)."

        if mastery_probability < 0.65:
            return f"{concept_title} is currently developing ({mastery_pct}% mastery). An extra practice session will strengthen core foundations."

        return f"Scheduled periodic check-in for {concept_title} to maintain retention at {mastery_pct}% mastery."

    @staticmethod
    def compute_schedules(
        student_id: str,
        practice_records: List[Dict[str, Any]],
        current_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        if current_date is None:
            current_date = datetime.now(timezone.utc).replace(tzinfo=None)

        # Deduplicate records by concept_id
        unique_records: Dict[str, Dict[str, Any]] = {}
        for rec in practice_records:
            unique_records[rec["concept_id"]] = rec

        due_revisions: List[RevisionSchedule] = []
        upcoming_revisions: List[RevisionSchedule] = []
        mastered_count = 0

        for cid, record in unique_records.items():
            last_practiced_str = record.get("last_practiced_at", current_date.isoformat())
            try:
                last_practiced = datetime.fromisoformat(last_practiced_str.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                last_practiced = current_date - timedelta(days=1)

            diff = max(timedelta(0), current_date - last_practiced)
            days_since = diff.days

            mastery_p = record.get("mastery_probability", 0.30)
            reps = record.get("repetitions_count", 1)
            recent_errors = record.get("recent_error_count", 0)

            interval = SpacedRevisionService.calculate_next_interval(
                reps, mastery_p, recent_errors == 0
            )

            next_due = last_practiced + timedelta(days=interval)
            is_due = current_date >= next_due

            status = RevisionStatus.DUE if is_due else RevisionStatus.SCHEDULED
            if mastery_p >= 0.90 and reps >= 4:
                status = RevisionStatus.MASTERED
                mastered_count += 1

            rationale = SpacedRevisionService.generate_rationale(
                record.get("concept_title", cid),
                days_since,
                mastery_p,
                is_due,
                recent_errors
            )

            item = RevisionSchedule(
                id=f"rev_{student_id}_{cid}",
                student_id=student_id,
                concept_id=cid,
                concept_title=record.get("concept_title", cid),
                last_practiced_at=last_practiced.isoformat(),
                next_review_due_at=next_due.isoformat(),
                interval_days=interval,
                repetitions_count=reps,
                mastery_probability=mastery_p,
                status=status,
                recommendation_rationale=rationale
            )

            if is_due:
                due_revisions.append(item)
            else:
                upcoming_revisions.append(item)

        # Sort due: lower mastery first, then most overdue
        due_revisions.sort(key=lambda x: (x.mastery_probability, x.next_review_due_at))
        # Sort upcoming: closest due date first
        upcoming_revisions.sort(key=lambda x: x.next_review_due_at)

        return {
            "due_revisions": due_revisions,
            "upcoming_revisions": upcoming_revisions,
            "mastered_count": mastered_count
        }

from typing import Optional
spaced_revision_service = SpacedRevisionService()

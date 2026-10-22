"""
Central In-Memory / Local Repository for LearnLens AI.
Stores live students, attempts, mastery states, diagnostic history,
revision schedules, content reviews, and content reports.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.models.schemas import (
    StudentMastery, Question, Concept, RevisionSchedule,
    RevisionStatus, ContentReport, ContentReportReason,
    ContentReportStatus, ContentReviewStatus, ValidationStatus,
    ConfidenceLevel
)
from app.data.curriculum import CONCEPTS, SEED_QUESTIONS, MISCONCEPTIONS

class DataRepository:
    def __init__(self):
        self.concepts: Dict[str, Concept] = {c.id: c for c in CONCEPTS}
        self.questions: Dict[str, Question] = {q.id: q for q in SEED_QUESTIONS}
        
        # Student Mastery Map: (student_id, concept_id) -> StudentMastery
        self.mastery_records: Dict[str, Dict[str, StudentMastery]] = {}
        
        # Student attempts log: List of dicts
        self.attempts: List[Dict[str, Any]] = []

        # Feature B: Spaced Revision Schedules: student_id -> Dict[concept_id, RevisionSchedule]
        self.revision_schedules: Dict[str, Dict[str, RevisionSchedule]] = {}

        # Feature D: Teacher Content Review Audit Log
        self.content_reviews: List[Dict[str, Any]] = []

        # Feature F: Student Content Reports
        self.content_reports: List[ContentReport] = []

        # Fictional demo users
        self.users = {
            "student_alex": {"id": "student_alex", "name": "Alex Chen", "role": "student", "grade": "8th Grade"},
            "student_priya": {"id": "student_priya", "name": "Priya Sharma", "role": "student", "grade": "8th Grade"},
            "student_marcus": {"id": "student_marcus", "name": "Marcus Vance", "role": "student", "grade": "8th Grade"},
            "teacher_sarah": {"id": "teacher_sarah", "name": "Ms. Sarah Jenkins", "role": "teacher", "classes": ["Grade 8 Math - Section A"]}
        }

        self._seed_demo_classroom_data()
        self._seed_features_data()

    def _seed_demo_classroom_data(self):
        """Seed realistic initial mastery and historical attempts for demo students."""
        self._init_student_mastery("student_alex", {
            "fractions_intro": 0.92,
            "equivalent_fractions": 0.85,
            "fraction_addition_like": 0.88,
            "fraction_addition_unlike": 0.35,
            "algebra_expressions": 0.78,
            "linear_equations_1step": 0.65,
            "linear_equations_2step": 0.32
        })

        self._init_student_mastery("student_priya", {
            "fractions_intro": 0.85,
            "equivalent_fractions": 0.80,
            "fraction_addition_like": 0.75,
            "fraction_addition_unlike": 0.70,
            "algebra_expressions": 0.95,
            "linear_equations_1step": 0.92,
            "linear_equations_2step": 0.89
        })

        self._init_student_mastery("student_marcus", {
            "fractions_intro": 0.60,
            "equivalent_fractions": 0.45,
            "fraction_addition_like": 0.50,
            "fraction_addition_unlike": 0.25,
            "algebra_expressions": 0.40,
            "linear_equations_1step": 0.35,
            "linear_equations_2step": 0.20
        })

        self.attempts.extend([
            {
                "id": "att_01",
                "student_id": "student_alex",
                "student_name": "Alex Chen",
                "question_id": "q_frac_unlike_01",
                "concept_id": "fraction_addition_unlike",
                "concept_name": "Adding Fractions (Unlike Denominators)",
                "student_answer": "2/5",
                "is_correct": False,
                "confidence": "high",  # Feature A: Overconfidence!
                "misconception_id": "add_denominators",
                "misconception_name": "Adding Across Denominators",
                "response_time_seconds": 18.5,
                "created_at": "2026-10-21T10:15:00Z",
                "is_reassessment": False
            },
            {
                "id": "att_02",
                "student_id": "student_marcus",
                "student_name": "Marcus Vance",
                "question_id": "q_frac_unlike_01",
                "concept_id": "fraction_addition_unlike",
                "concept_name": "Adding Fractions (Unlike Denominators)",
                "student_answer": "2/5",
                "is_correct": False,
                "confidence": "medium",
                "misconception_id": "add_denominators",
                "misconception_name": "Adding Across Denominators",
                "response_time_seconds": 24.2,
                "created_at": "2026-10-21T10:18:00Z",
                "is_reassessment": False
            },
            {
                "id": "att_03",
                "student_id": "student_alex",
                "student_name": "Alex Chen",
                "question_id": "q_lin_2step_01",
                "concept_id": "linear_equations_2step",
                "concept_name": "Two-Step Linear Equations",
                "student_answer": "13",
                "is_correct": False,
                "confidence": "high",  # Overconfidence!
                "misconception_id": "sign_flip_omission",
                "misconception_name": "Missing Sign Reversal in Equation Isolation",
                "response_time_seconds": 32.0,
                "created_at": "2026-10-21T10:22:00Z",
                "is_reassessment": False
            },
            {
                "id": "att_04",
                "student_id": "student_priya",
                "student_name": "Priya Sharma",
                "question_id": "q_lin_2step_01",
                "concept_id": "linear_equations_2step",
                "concept_name": "Two-Step Linear Equations",
                "student_answer": "7",
                "is_correct": True,
                "confidence": "high",  # Mastery alignment
                "misconception_id": None,
                "misconception_name": None,
                "response_time_seconds": 12.4,
                "created_at": "2026-10-21T10:25:00Z",
                "is_reassessment": False
            }
        ])

    def _seed_features_data(self):
        """Seed AI-generated questions in various review states (Feature D) and initial reports (Feature F)."""
        now = datetime.utcnow()
        five_days_ago = (now - timedelta(days=5)).isoformat()
        yesterday = (now - timedelta(days=1)).isoformat()

        # Feature D: AI-Generated Questions in various review statuses
        ai_questions = [
            Question(
                id="q_gen_pending_01",
                concept_id="linear_equations_2step",
                prompt="Solve for x: 3x - 5 = 16",
                correct_answer="x = 7",
                difficulty=0.55,
                worked_solution=["Add 5 to both sides: 3x = 21", "Divide by 3: x = 7"],
                source="generated",
                review_status=ContentReviewStatus.PENDING_REVIEW,
                validation_status=ValidationStatus.VALID,
                active=False
            ),
            Question(
                id="q_gen_approved_01",
                concept_id="linear_equations_1step",
                prompt="Solve for y: 4y + 8 = 24",
                correct_answer="y = 4",
                difficulty=0.45,
                worked_solution=["Subtract 8: 4y = 16", "Divide by 4: y = 4"],
                source="generated",
                review_status=ContentReviewStatus.APPROVED,
                validation_status=ValidationStatus.VALID,
                reviewed_by="teacher_sarah",
                reviewed_at=yesterday,
                active=True
            ),
            Question(
                id="q_gen_rejected_01",
                concept_id="linear_equations_2step",
                prompt="Solve for x: x^3 - 8 = 0",
                correct_answer="x = 2",
                difficulty=0.85,
                worked_solution=["Factor or cube root"],
                source="generated",
                review_status=ContentReviewStatus.REJECTED,
                validation_status=ValidationStatus.VALID,
                rejection_reason="Cubic polynomial is outside the Grade 8 linear equations scope.",
                reviewed_by="teacher_sarah",
                reviewed_at=yesterday,
                active=False
            ),
            Question(
                id="q_gen_draft_01",
                concept_id="algebra_expressions",
                prompt="Simplify: 2(x + 3) - x",
                correct_answer="x + 6",
                difficulty=0.35,
                worked_solution=["Distribute: 2x + 6 - x = x + 6"],
                source="generated",
                review_status=ContentReviewStatus.DRAFT,
                validation_status=ValidationStatus.VALID,
                active=False
            ),
            Question(
                id="q_gen_disabled_01",
                concept_id="fraction_addition_like",
                prompt="Evaluate 1/4 + 1/4 with denominator 8",
                correct_answer="2/4",
                difficulty=0.60,
                worked_solution=["Keep denominator"],
                source="generated",
                review_status=ContentReviewStatus.DISABLED,
                validation_status=ValidationStatus.VALID,
                rejection_reason="Misleading prompt text disabled to avoid student confusion.",
                reviewed_by="teacher_sarah",
                reviewed_at=five_days_ago,
                active=False
            )
        ]

        for q in ai_questions:
            self.questions[q.id] = q

        # Feature B: Initial Spaced Revision for student_alex
        self.revision_schedules["student_alex"] = {
            "fractions_intro": RevisionSchedule(
                id="rev_alex_fractions_intro",
                student_id="student_alex",
                concept_id="fractions_intro",
                concept_title="Introduction to Fractions",
                last_practiced_at=five_days_ago,
                next_review_due_at=yesterday,  # OVERDUE!
                interval_days=4,
                repetitions_count=3,
                mastery_probability=0.92,
                status=RevisionStatus.DUE,
                recommendation_rationale="Last practiced 5 days ago. Revision is due to counteract memory decay (current mastery: 92%)."
            ),
            "fraction_addition_unlike": RevisionSchedule(
                id="rev_alex_fraction_addition_unlike",
                student_id="student_alex",
                concept_id="fraction_addition_unlike",
                concept_title="Adding Fractions (Unlike Denominators)",
                last_practiced_at=yesterday,
                next_review_due_at=now.isoformat(),  # Due today!
                interval_days=1,
                repetitions_count=1,
                mastery_probability=0.35,
                status=RevisionStatus.DUE,
                recommendation_rationale="Recent mistakes were detected in Adding Fractions (Unlike Denominators) (mastery 35%). Early review prevents misconceptions from cementing."
            )
        }

        # Feature F: Initial Student Content Report
        self.content_reports.append(
            ContentReport(
                id="rep_seed_01",
                student_id="student_alex",
                student_name="Alex Chen",
                content_id="q_frac_unlike_01",
                content_type="question",
                content_version=1,
                reason=ContentReportReason.CONFUSING_EXPLANATION,
                comment="Could the explanation visually illustrate why 1/2 and 1/3 need to become 3/6 and 2/6?",
                status=ContentReportStatus.PENDING,
                created_at=yesterday
            )
        )

    def _init_student_mastery(self, student_id: str, mastery_dict: Dict[str, float]):
        self.mastery_records[student_id] = {}
        now = datetime.utcnow().isoformat()
        for c_id, val in mastery_dict.items():
            self.mastery_records[student_id][c_id] = StudentMastery(
                student_id=student_id,
                concept_id=c_id,
                p_mastery=val,
                last_updated=now,
                practice_count=3,
                correct_count=int(val * 3),
                consecutive_correct=1 if val > 0.7 else 0
            )

    def get_or_create_student_mastery(self, student_id: str, concept_id: str) -> StudentMastery:
        if student_id not in self.mastery_records:
            self.mastery_records[student_id] = {}
        if concept_id not in self.mastery_records[student_id]:
            self.mastery_records[student_id][concept_id] = StudentMastery(
                student_id=student_id,
                concept_id=concept_id,
                p_mastery=0.20,
                last_updated=datetime.utcnow().isoformat(),
                practice_count=0,
                correct_count=0,
                consecutive_correct=0
            )
        return self.mastery_records[student_id][concept_id]

    def record_attempt(self, attempt_data: Dict[str, Any]):
        self.attempts.append(attempt_data)

repo = DataRepository()

"""
Central In-Memory / Local Repository for LearnLens AI.
Stores live students, attempts, mastery states, diagnostic history,
and supports Supabase PostgreSQL schema compatibility.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from app.models.schemas import StudentMastery, Question, Concept
from app.data.curriculum import CONCEPTS, SEED_QUESTIONS, MISCONCEPTIONS

class DataRepository:
    def __init__(self):
        self.concepts: Dict[str, Concept] = {c.id: c for c in CONCEPTS}
        self.questions: Dict[str, Question] = {q.id: q for q in SEED_QUESTIONS}
        
        # Student Mastery Map: (student_id, concept_id) -> StudentMastery
        self.mastery_records: Dict[str, Dict[str, StudentMastery]] = {}
        
        # Student attempts log: List of dicts
        self.attempts: List[Dict[str, Any]] = []

        # Fictional demo users
        self.users = {
            "student_alex": {"id": "student_alex", "name": "Alex Chen", "role": "student", "grade": "8th Grade"},
            "student_priya": {"id": "student_priya", "name": "Priya Sharma", "role": "student", "grade": "8th Grade"},
            "student_marcus": {"id": "student_marcus", "name": "Marcus Vance", "role": "student", "grade": "8th Grade"},
            "teacher_sarah": {"id": "teacher_sarah", "name": "Ms. Sarah Jenkins", "role": "teacher", "classes": ["Grade 8 Math - Section A"]}
        }

        self._seed_demo_classroom_data()

    def _seed_demo_classroom_data(self):
        """Seed realistic initial mastery and historical attempts for demo students."""
        # Alex has mastered fractions_intro, struggling with fraction_addition_unlike and 2-step equations
        self._init_student_mastery("student_alex", {
            "fractions_intro": 0.92,
            "equivalent_fractions": 0.85,
            "fraction_addition_like": 0.88,
            "fraction_addition_unlike": 0.35,
            "algebra_expressions": 0.78,
            "linear_equations_1step": 0.65,
            "linear_equations_2step": 0.32
        })

        # Priya has high mastery across algebra, moderate in fractions
        self._init_student_mastery("student_priya", {
            "fractions_intro": 0.85,
            "equivalent_fractions": 0.80,
            "fraction_addition_like": 0.75,
            "fraction_addition_unlike": 0.70,
            "algebra_expressions": 0.95,
            "linear_equations_1step": 0.92,
            "linear_equations_2step": 0.89
        })

        # Marcus is at-risk in both algebra and fractions
        self._init_student_mastery("student_marcus", {
            "fractions_intro": 0.60,
            "equivalent_fractions": 0.45,
            "fraction_addition_like": 0.50,
            "fraction_addition_unlike": 0.25,
            "algebra_expressions": 0.40,
            "linear_equations_1step": 0.35,
            "linear_equations_2step": 0.20
        })

        # Seed initial historical attempts for teacher analytics
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
                "misconception_id": None,
                "misconception_name": None,
                "response_time_seconds": 12.4,
                "created_at": "2026-10-21T10:25:00Z",
                "is_reassessment": False
            }
        ])

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

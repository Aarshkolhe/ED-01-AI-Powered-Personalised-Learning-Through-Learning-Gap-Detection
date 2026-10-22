from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"

class ConceptDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class Concept(BaseModel):
    id: str
    name: str
    description: str
    difficulty: ConceptDifficulty = ConceptDifficulty.BEGINNER
    order: int
    prerequisites: List[str] = []
    category: str = "Mathematics"
    mastery_threshold: float = 0.85

class QuestionOption(BaseModel):
    id: str
    text: str
    text_hi: Optional[str] = None
    misconception_id: Optional[str] = None
    misconception_explanation: Optional[str] = None
    misconception_explanation_hi: Optional[str] = None

class Question(BaseModel):
    id: str
    concept_id: str
    prompt: str
    prompt_hi: Optional[str] = None
    question_type: str = "multiple_choice"  # multiple_choice | numeric
    options: List[QuestionOption] = []
    correct_answer: str
    tolerance: Optional[float] = None
    worked_solution: List[str]
    worked_solution_hi: Optional[List[str]] = None
    difficulty: float = 0.5  # 0.0 - 1.0

class BKTParameters(BaseModel):
    p_init: float = 0.20       # Prior probability student knows concept L_0
    p_transit: float = 0.15    # Probability of learning between opportunities T
    p_guess: float = 0.20      # Probability of guessing correctly without knowing G
    p_slip: float = 0.10       # Probability of slipping (incorrect despite knowing) S

class StudentMastery(BaseModel):
    student_id: str
    concept_id: str
    p_mastery: float = 0.20
    last_updated: str
    practice_count: int = 0
    correct_count: int = 0
    consecutive_correct: int = 0

class AnswerSubmission(BaseModel):
    student_id: str
    question_id: str
    student_answer: str
    response_time_seconds: float
    free_text_reasoning: Optional[str] = None
    assessment_id: Optional[str] = None
    is_reassessment: bool = False

class AnswerEvaluation(BaseModel):
    is_correct: bool
    correct_answer: str
    concept_id: str
    detected_misconception: Optional[str] = None
    misconception_explanation: Optional[str] = None
    ai_feedback: Optional[str] = None
    step_analysis: Optional[Dict[str, Any]] = None
    previous_mastery: float
    updated_mastery: float
    mastery_change: float
    is_mastered: bool
    response_time_seconds: float
    time_signal: str  # "fast", "normal", "prolonged"

class StepSubmission(BaseModel):
    problem_statement: str
    correct_final_answer: str
    student_steps: List[str]
    student_id: Optional[str] = None
    concept_id: Optional[str] = None

class StepMistakeAnalysis(BaseModel):
    has_error: bool
    first_error_step_index: Optional[int] = None
    student_erroneous_step: Optional[str] = None
    error_type: Optional[str] = None
    error_explanation: Optional[str] = None
    corrected_step: Optional[str] = None
    full_corrected_solution: List[str]

class QuestionGenerationRequest(BaseModel):
    concept_id: str
    misconception_id: str
    difficulty: Optional[float] = 0.5
    language: str = "en"

class RecoveryPlan(BaseModel):
    student_id: str
    focal_concept_id: str
    focal_concept_name: str
    active_gaps: List[str]
    prerequisite_remediation_order: List[Dict[str, Any]]
    recommended_activities: List[Dict[str, Any]]
    estimated_duration_minutes: int

class RecoveryScoreReport(BaseModel):
    student_id: str
    concept_id: str
    concept_name: str
    pre_score: float
    post_score: float
    score_delta: float
    recovery_percentage: float
    concepts_improved: List[str]
    remaining_gaps: List[str]
    baseline_attempts: int
    post_attempts: int
    status: str
    disclaimer: str = "This metric is an indicator of targeted instructional progress and is not a standardized psychometric measurement."

class ClassroomAnalytics(BaseModel):
    total_students: int
    average_mastery: float
    at_risk_students_count: int
    top_misconceptions: List[Dict[str, Any]]
    concept_heatmaps: List[Dict[str, Any]]
    recent_attempts: List[Dict[str, Any]]
    intervention_recommendations: List[Dict[str, Any]]

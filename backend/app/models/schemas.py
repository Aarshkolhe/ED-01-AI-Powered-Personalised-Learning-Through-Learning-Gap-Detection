from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

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

# Spec §18.1: Controlled Error Taxonomy
class ErrorTaxonomyCategory(str, Enum):
    PREREQUISITE_GAP = "prerequisite_gap"
    CONCEPT_MISUNDERSTANDING = "concept_misunderstanding"
    FORMULA_CONFUSION = "formula_confusion"
    ARITHMETIC_OR_SIGN_ERROR = "arithmetic_or_sign_error"
    QUESTION_MISREAD = "question_misread"
    POSSIBLE_TYPO = "possible_typo"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"

# Feature D: Teacher Review of AI-Generated Content States
class ContentReviewStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISABLED = "disabled"

class ValidationStatus(str, Enum):
    VALID = "valid"
    INVALID = "invalid"
    UNVALIDATED = "unvalidated"

# Spec §7 & §20: Student-Safe Question Representation (Omitted correct answers before submission)
class StudentQuestionOption(BaseModel):
    id: str
    text: str
    text_hi: Optional[str] = None

class StudentQuestion(BaseModel):
    id: str
    concept_id: str
    prompt: str
    prompt_hi: Optional[str] = None
    question_type: str = "multiple_choice"
    options: List[StudentQuestionOption] = []
    difficulty: float = 0.5
    source: str = "curated"
    review_status: ContentReviewStatus = ContentReviewStatus.APPROVED
    is_follow_up: bool = False
    parent_question_id: Optional[str] = None

class Question(BaseModel):
    id: str
    concept_id: str
    prompt: str
    prompt_hi: Optional[str] = None
    question_type: str = "multiple_choice"  # multiple_choice | numeric
    options: List[QuestionOption] = []
    correct_answer: str
    tolerance: Optional[float] = None
    worked_solution: List[str] = []
    worked_solution_hi: Optional[List[str]] = None
    difficulty: float = 0.5  # 0.0 - 1.0
    source: str = "curated"  # "curated" | "generated"
    review_status: ContentReviewStatus = ContentReviewStatus.APPROVED
    validation_status: ValidationStatus = ValidationStatus.VALID
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    content_version: int = 1
    active: bool = True
    competing_misconceptions: Optional[List[str]] = None
    is_follow_up: bool = False
    parent_question_id: Optional[str] = None
    error_taxonomy: Optional[ErrorTaxonomyCategory] = None

    def to_student_view(self) -> StudentQuestion:
        return StudentQuestion(
            id=self.id,
            concept_id=self.concept_id,
            prompt=self.prompt,
            prompt_hi=self.prompt_hi,
            question_type=self.question_type,
            options=[
                StudentQuestionOption(id=o.id, text=o.text, text_hi=o.text_hi)
                for o in self.options
            ],
            difficulty=self.difficulty,
            source=self.source,
            review_status=self.review_status,
            is_follow_up=self.is_follow_up,
            parent_question_id=self.parent_question_id
        )

class BKTParameters(BaseModel):
    p_init: float = 0.20       # Prior probability student knows concept L_0
    p_transit: float = 0.15    # Probability of learning between opportunities T
    p_guess: float = 0.20      # Probability of guessing correctly without knowing G
    p_slip: float = 0.10       # Probability of slipping (incorrect despite knowing) S

class BKTModelVersion(BaseModel):
    version: str = "1.0.0"
    description: str = "Standard 4-parameter Bayesian Knowledge Tracing with prototype Dirichlet defaults"
    parameters: BKTParameters = BKTParameters()
    is_calibrated: bool = False
    calibration_notes: str = "Prototype defaults (P_L0=0.20, P_T=0.15, P_G=0.20, P_S=0.10). Model version 1.0.0."

class StudentMastery(BaseModel):
    student_id: str
    concept_id: str
    p_mastery: float = 0.20
    last_updated: str
    practice_count: int = 0
    correct_count: int = 0
    consecutive_correct: int = 0

# Feature A: Confidence-Based Learning Insights
class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ConfidencePattern(str, Enum):
    OVERCONFIDENCE = "overconfidence"
    UNDERCONFIDENCE = "underconfidence"
    CONSCIOUS_UNCERTAINTY = "conscious_uncertainty"
    MASTERY_ALIGNMENT = "mastery_alignment"
    UNSPECIFIED = "unspecified"

class ConfidenceInsight(BaseModel):
    pattern: ConfidencePattern
    level: Optional[ConfidenceLevel] = None
    title: str
    message: str
    suggested_action: str

class AnswerSubmission(BaseModel):
    student_id: str
    question_id: str
    student_answer: str
    response_time_seconds: float
    confidence: Optional[ConfidenceLevel] = None  # Feature A: Optional confidence
    free_text_reasoning: Optional[str] = None
    assessment_id: Optional[str] = None
    is_reassessment: bool = False
    idempotency_key: Optional[str] = None

class AnswerEvaluation(BaseModel):
    is_correct: bool
    correct_answer: str
    concept_id: str
    detected_misconception: Optional[str] = None
    misconception_explanation: Optional[str] = None
    error_taxonomy: Optional[ErrorTaxonomyCategory] = None  # Spec §18.1 taxonomy
    ai_feedback: Optional[str] = None
    step_analysis: Optional[Dict[str, Any]] = None
    worked_solution: Optional[List[str]] = None
    previous_mastery: float
    updated_mastery: float
    mastery_change: float
    is_mastered: bool
    response_time_seconds: float
    time_signal: str  # "fast", "normal", "prolonged"
    confidence_insight: Optional[ConfidenceInsight] = None  # Feature A
    needs_follow_up: bool = False  # Spec §19: Diagnostic follow-up
    follow_up_question: Optional[StudentQuestion] = None

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

# Feature B: Spaced Revision & Intelligent Practice Scheduling
class RevisionStatus(str, Enum):
    DUE = "due"
    SCHEDULED = "scheduled"
    MASTERED = "mastered"

class RevisionSchedule(BaseModel):
    id: str
    student_id: str
    concept_id: str
    concept_title: str
    last_practiced_at: str
    next_review_due_at: str
    interval_days: int
    repetitions_count: int
    mastery_probability: float
    status: RevisionStatus
    recommendation_rationale: str

# Feature C: Explainable Recommendations
class RecommendationReasonCode(str, Enum):
    PREREQUISITE_MASTERY_LOW = "prerequisite_mastery_low"
    RECENT_ERROR_PATTERN = "recent_error_pattern"
    MASTERY_UNCERTAIN = "mastery_uncertain"
    READY_FOR_HARDER_QUESTION = "ready_for_harder_question"
    SPACED_REVIEW_DUE = "spaced_review_due"

class Recommendation(BaseModel):
    activity_type: str  # "question" | "lesson" | "prerequisite_review" | "spaced_revision"
    concept_id: str
    concept_title: str
    question_id: Optional[str] = None
    reason_code: RecommendationReasonCode
    explanation: str
    evidence_summary: Optional[str] = None

# Feature F: Student Feedback & Content Reporting
class ContentReportReason(str, Enum):
    INCORRECT_ANSWER = "incorrect_answer"
    CONFUSING_EXPLANATION = "confusing_explanation"
    DUPLICATE_QUESTION = "duplicate_question"
    TYPO_OR_FORMATTING = "typo_or_formatting"
    OTHER = "other"

class ContentReportStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class ContentReport(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    content_id: str
    content_type: str = "question"
    content_version: int = 1
    reason: ContentReportReason
    comment: str
    status: ContentReportStatus = ContentReportStatus.PENDING
    created_at: str
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

# Spec §18.6: Fair Teacher Support Signals
class SupportSignal(str, Enum):
    NEEDS_SUPPORT = "Needs Support"
    MONITORING = "Monitoring"
    ON_TRACK = "On Track"
    INSUFFICIENT_DATA = "Insufficient Data"

class StudentSummary(BaseModel):
    student_id: str
    name: str
    grade: str = "8th Grade"
    average_mastery: float
    support_signal: SupportSignal = SupportSignal.MONITORING
    risk_level: str = "Moderate Risk"  # Kept for compatibility
    evidence_summary: str
    attempt_count: int
    last_active: Optional[str] = None
    active_gaps_count: int
    active_gaps: List[str]

class ClassroomAnalytics(BaseModel):
    total_students: int
    average_mastery: float
    at_risk_students_count: int
    students_needing_support_count: int = 0
    top_misconceptions: List[Dict[str, Any]]
    concept_heatmaps: List[Dict[str, Any]]
    recent_attempts: List[Dict[str, Any]]
    intervention_recommendations: List[Dict[str, Any]]


# =======================================================================
# xAI Grok & Dynamic Learning Schemas
# =======================================================================

class AIProviderHealth(BaseModel):
    status: str  # "ready", "missing_key", "rate_limited", "invalid_key", "error", "offline_fallback"
    provider: str = "xAI Grok"
    model: str
    is_configured: bool
    is_fallback: bool
    message: str

class TutorChatMessage(BaseModel):
    id: Optional[str] = None
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None

class TutorChatRequest(BaseModel):
    student_id: str = "student_alex"
    subject: str = "Mathematics"
    topic: str
    level: str = "intermediate"  # "beginner" | "intermediate" | "advanced"
    messages: List[TutorChatMessage] = []
    action: Optional[str] = None  # "simplify", "worked_example", "analogy", "summary", "practice_question", "general"

class TutorChatResponse(BaseModel):
    response: str
    subject: str
    topic: str
    level: str
    suggested_followups: List[str] = []
    practice_question: Optional[Dict[str, Any]] = None
    is_fallback: bool = False
    model: str = "grok-2-latest"
    error: Optional[str] = None

class DynamicLessonRequest(BaseModel):
    student_id: str = "student_alex"
    subject: str = "Mathematics"
    topic: str
    level: str = "intermediate"  # "beginner" | "intermediate" | "advanced"
    learning_objective: Optional[str] = None
    style: Optional[str] = "concept_first"  # "concept_first" | "analogy_heavy" | "step_by_step"
    difficulty_areas: Optional[List[str]] = None

class DynamicLesson(BaseModel):
    id: str
    student_id: Optional[str] = None
    subject: str
    topic: str
    level: str
    learning_objectives: List[str] = []
    prerequisites: List[str] = []
    core_explanation: str
    step_by_step_examples: List[Dict[str, Any]] = []
    common_mistakes_and_misconceptions: List[Dict[str, str]] = []
    practice_questions: List[Dict[str, Any]] = []
    short_summary: str
    suggested_next_steps: List[str] = []
    review_status: ContentReviewStatus = ContentReviewStatus.APPROVED
    created_at: str
    is_fallback: bool = False

class DynamicAssessmentRequest(BaseModel):
    student_id: str = "student_alex"
    subject: str = "Mathematics"
    topic: str
    difficulty: float = 0.5
    question_count: int = 3
    question_type: str = "multiple_choice"  # "multiple_choice" | "short_answer" | "mixed"

class DynamicAssessmentSession(BaseModel):
    assessment_id: str
    student_id: str
    subject: str
    topic: str
    difficulty: float
    questions: List[StudentQuestion]  # Answer secrecy: no correct answers!
    total_questions: int
    created_at: str

class DynamicAnswerItem(BaseModel):
    question_id: str
    student_answer: str
    confidence: Optional[ConfidenceLevel] = None
    reasoning: Optional[str] = None
    response_time_seconds: Optional[float] = 10.0

class DynamicAssessmentSubmitRequest(BaseModel):
    assessment_id: str
    student_id: str = "student_alex"
    answers: List[DynamicAnswerItem]

class DynamicAssessmentResult(BaseModel):
    assessment_id: str
    student_id: str
    subject: str
    topic: str
    score: float
    correct_count: int
    total_questions: int
    evaluations: List[AnswerEvaluation]
    overall_feedback: str
    suggested_next_steps: List[str]
    is_fallback: bool = False

class TopicCatalogItem(BaseModel):
    id: str
    name: str
    subject: str
    status: str  # "verified", "community_requested", "ai_proposed"
    prerequisites: List[str] = []
    mastery_threshold: float = 0.85
    description: Optional[str] = None

class ContentModerationAction(BaseModel):
    action: str  # "approve" | "reject" | "disable"
    teacher_id: str = "teacher_default"
    reason: Optional[str] = None

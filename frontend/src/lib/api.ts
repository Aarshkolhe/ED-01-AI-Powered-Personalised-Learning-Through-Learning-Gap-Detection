/**
 * LearnLens AI Frontend API Client
 * Central client for interacting with the backend API or graceful demo fallback
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Concept {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  order: number;
  prerequisites: string[];
  category: string;
  mastery_threshold: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  text_hi?: string;
  misconception_id?: string;
  misconception_explanation?: string;
  misconception_explanation_hi?: string;
}

export interface Question {
  id: string;
  concept_id: string;
  prompt: string;
  prompt_hi?: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer?: string;
  worked_solution?: string[];
  worked_solution_hi?: string[];
  difficulty: number;
  source?: string;
  review_status?: string;
  is_follow_up?: boolean;
  parent_question_id?: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ConfidencePattern =
  | 'overconfidence'
  | 'underconfidence'
  | 'conscious_uncertainty'
  | 'mastery_alignment'
  | 'uncalibrated';

export interface ConfidenceInsight {
  confidence: ConfidenceLevel;
  is_correct: boolean;
  pattern: ConfidencePattern;
  insight_message: string;
  actionable_guidance: string;
}

export interface AnswerEvaluation {
  is_correct: boolean;
  correct_answer: string;
  concept_id: string;
  detected_misconception?: string;
  misconception_explanation?: string;
  error_taxonomy?: string;
  ai_feedback?: string;
  worked_solution?: string[];
  previous_mastery: number;
  updated_mastery: number;
  mastery_change: number;
  is_mastered: boolean;
  response_time_seconds: number;
  time_signal: string;
  confidence_insight?: ConfidenceInsight;
  needs_follow_up?: boolean;
  follow_up_question?: Question;
}

export interface StepMistakeAnalysis {
  has_error: boolean;
  first_error_step_index?: number;
  student_erroneous_step?: string;
  error_type?: string;
  error_explanation?: string;
  corrected_step?: string;
  full_corrected_solution: string[];
}

export interface RecoveryPlan {
  student_id: string;
  focal_concept_id: string;
  focal_concept_name: string;
  active_gaps: string[];
  prerequisite_remediation_order: Array<{
    concept_id: string;
    concept_name: string;
    current_mastery: number;
    priority: string;
    reason: string;
  }>;
  recommended_activities: Array<{
    id: string;
    title: string;
    type: string;
    estimated_minutes: number;
    description: string;
  }>;
  estimated_duration_minutes: number;
}

export interface RecoveryScoreReport {
  student_id: string;
  concept_id: string;
  concept_name: string;
  pre_score: number;
  post_score: number;
  score_delta: number;
  recovery_percentage: number;
  concepts_improved: string[];
  remaining_gaps: string[];
  baseline_attempts: number;
  post_attempts: number;
  status: string;
  disclaimer: string;
}

export interface ClassroomAnalytics {
  total_students: number;
  average_mastery: number;
  at_risk_students_count: number;
  students_needing_support_count?: number;
  top_misconceptions: Array<{
    misconception_id: string;
    name: string;
    count: number;
    affected_students: string[];
    recommended_intervention: string;
  }>;
  concept_heatmaps: Array<{
    concept_id: string;
    concept_name: string;
    category: string;
    average_mastery: number;
    status: string;
  }>;
  recent_attempts: Record<string, unknown>[];
  intervention_recommendations: Array<{
    priority: string;
    concept: string;
    targeted_misconception: string;
    impacted_students: string[];
    action: string;
  }>;
}

export interface RevisionSchedule {
  id: string;
  student_id: string;
  concept_id: string;
  concept_title: string;
  last_practiced_at: string;
  next_review_due_at: string;
  interval_days: number;
  repetitions_count: number;
  mastery_probability: number;
  status: 'due' | 'scheduled' | 'mastered';
  recommendation_rationale: string;
}

export interface Recommendation {
  activity_type: string;
  concept_id: string;
  concept_title: string;
  question_id?: string;
  reason_code: 'prerequisite_mastery_low' | 'recent_error_pattern' | 'mastery_uncertain' | 'ready_for_harder_question' | 'spaced_review_due';
  explanation: string;
  evidence_summary: string;
}

export interface ContentReviewItem {
  id: string;
  concept_id: string;
  prompt: string;
  correct_answer: string;
  options: QuestionOption[];
  difficulty: number;
  source: string;
  review_status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'disabled';
  validation_status: string;
  active: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface ContentReport {
  id: string;
  question_id: string;
  student_id: string;
  category: 'incorrect_answer_key' | 'ambiguous_wording' | 'typo_or_formatting' | 'pedagogically_unclear' | 'technical_glitch';
  description: string;
  created_at: string;
  resolved: boolean;
  resolution_action?: string;
  resolution_notes?: string;
}

export interface StudentConfidenceSummary {
  student_id: string;
  total_attempts_with_confidence: number;
  overconfidence_count: number;
  underconfidence_count: number;
  mastery_alignment_count: number;
  calibration_score: number;
  recommendations: string[];
}

export type SupportSignal = 'Needs Support' | 'Monitoring' | 'On Track' | 'Insufficient Data';

export interface StudentSummary {
  student_id: string;
  name: string;
  grade: string;
  average_mastery: number;
  support_signal: SupportSignal;
  risk_level: string;
  evidence_summary: string;
  attempt_count: number;
  last_active?: string;
  active_gaps_count: number;
  active_gaps: string[];
}

export const api = {
  getStatus: async () => {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  getConcepts: async (): Promise<Concept[]> => {
    const res = await fetch(`${API_BASE}/concepts`);
    if (!res.ok) throw new Error('Failed to fetch concepts');
    return res.json();
  },

  getKnowledgeGraph: async (studentId: string = 'student_alex') => {
    const res = await fetch(`${API_BASE}/graph?student_id=${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  validateKnowledgeGraph: async (): Promise<{
    is_valid: boolean;
    has_cycles: boolean;
    cycles: string[][];
    topological_order: string[];
    total_concepts: number;
  }> => {
    const res = await fetch(`${API_BASE}/graph/validate`);
    if (!res.ok) throw new Error('Failed to validate knowledge graph');
    return res.json();
  },

  getBktConfig: async () => {
    const res = await fetch(`${API_BASE}/model/bkt/config`);
    if (!res.ok) throw new Error('Failed to fetch BKT config');
    return res.json();
  },

  getDiagnosticQuestions: async (conceptId?: string): Promise<Question[]> => {
    const url = conceptId 
      ? `${API_BASE}/diagnostic/questions?concept_id=${conceptId}` 
      : `${API_BASE}/diagnostic/questions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch diagnostic questions');
    return res.json();
  },

  getReassessmentQuestions: async (conceptId?: string): Promise<Question[]> => {
    const url = conceptId 
      ? `${API_BASE}/reassessment/questions?concept_id=${conceptId}` 
      : `${API_BASE}/reassessment/questions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reassessment questions');
    return res.json();
  },

  submitAnswer: async (data: {
    student_id: string;
    question_id: string;
    student_answer: string;
    response_time_seconds: number;
    free_text_reasoning?: string;
    confidence?: ConfidenceLevel;
    is_reassessment?: boolean;
    idempotency_key?: string;
  }): Promise<AnswerEvaluation> => {
    const res = await fetch(`${API_BASE}/diagnostic/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  },

  analyzeSteps: async (data: {
    problem_statement: string;
    correct_final_answer: string;
    student_steps: string[];
    student_id?: string;
    concept_id?: string;
  }): Promise<StepMistakeAnalysis> => {
    const res = await fetch(`${API_BASE}/steps/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to analyze steps');
    return res.json();
  },

  generateMisconceptionQuestion: async (data: {
    concept_id: string;
    misconception_id: string;
    difficulty?: number;
    language?: string;
  }): Promise<Question> => {
    const res = await fetch(`${API_BASE}/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate question');
    return res.json();
  },

  getRecoveryPlan: async (studentId: string, conceptId: string): Promise<RecoveryPlan> => {
    const res = await fetch(`${API_BASE}/recovery/plan?student_id=${studentId}&concept_id=${conceptId}`);
    if (!res.ok) throw new Error('Failed to fetch recovery plan');
    return res.json();
  },

  getRecoveryScore: async (studentId: string, conceptId: string): Promise<RecoveryScoreReport> => {
    const res = await fetch(`${API_BASE}/recovery/score?student_id=${studentId}&concept_id=${conceptId}`);
    if (!res.ok) throw new Error('Failed to fetch recovery score');
    return res.json();
  },

  getClassroomAnalytics: async (): Promise<ClassroomAnalytics> => {
    const res = await fetch(`${API_BASE}/analytics/classroom`);
    if (!res.ok) throw new Error('Failed to fetch classroom analytics');
    return res.json();
  },

  getStudentsSummary: async (): Promise<StudentSummary[]> => {
    const res = await fetch(`${API_BASE}/analytics/students`);
    if (!res.ok) throw new Error('Failed to fetch students summary');
    return res.json();
  },

  // Feature B: Spaced Revision
  getRevisionSchedule: async (studentId: string = 'student_alex'): Promise<{
    due_revisions: RevisionSchedule[];
    upcoming_revisions: RevisionSchedule[];
    total_tracked: number;
    mastered_count: number;
  }> => {
    const res = await fetch(`${API_BASE}/revision/schedule?student_id=${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch revision schedule');
    return res.json();
  },

  completeRevision: async (
    conceptId: string,
    studentId: string = 'student_alex',
    isCorrect: boolean = true
  ): Promise<{ success: boolean; next_interval_days: number; next_due_at: string; rationale: string }> => {
    const res = await fetch(`${API_BASE}/revision/${conceptId}/complete?student_id=${studentId}&is_correct=${isCorrect}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to complete revision');
    return res.json();
  },

  // Feature C: Explainable Recommendations
  getExplainableRecommendation: async (
    studentId: string = 'student_alex',
    targetConceptId?: string
  ): Promise<Recommendation> => {
    const url = targetConceptId
      ? `${API_BASE}/recommendations/next?student_id=${studentId}&target_concept_id=${targetConceptId}`
      : `${API_BASE}/recommendations/next?student_id=${studentId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recommendation');
    return res.json();
  },

  // Feature D: Teacher Content Review
  getContentReviews: async (status?: string): Promise<ContentReviewItem[]> => {
    const url = status
      ? `${API_BASE}/teacher/content-reviews?status=${status}`
      : `${API_BASE}/teacher/content-reviews`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch content reviews');
    return res.json();
  },

  processContentReview: async (
    questionId: string,
    data: {
      action: 'approve' | 'reject' | 'disable' | 'request_review';
      reviewer_id?: string;
      reviewer_name?: string;
      reason?: string;
    }
  ): Promise<{ success: boolean; message: string; question?: ContentReviewItem }> => {
    const res = await fetch(`${API_BASE}/teacher/content-reviews/${questionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to process content review');
    return res.json();
  },

  // Feature F: Content Reporting
  submitReport: async (data: {
    question_id: string;
    student_id: string;
    category: string;
    description: string;
  }): Promise<{ success: boolean; report_id: string; message: string }> => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  },

  getTeacherReports: async (): Promise<ContentReport[]> => {
    const res = await fetch(`${API_BASE}/teacher/reports`);
    if (!res.ok) throw new Error('Failed to fetch teacher reports');
    return res.json();
  },

  resolveTeacherReport: async (
    reportId: string,
    data: {
      action: 'quarantine' | 'dismiss' | 'edit';
      notes?: string;
      reviewer_id?: string;
    }
  ): Promise<{ success: boolean; report: ContentReport }> => {
    const res = await fetch(`${API_BASE}/teacher/reports/${reportId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to resolve report');
    return res.json();
  },

  getStudentConfidenceSummary: async (
    studentId: string = 'student_alex'
  ): Promise<StudentConfidenceSummary> => {
    const res = await fetch(`${API_BASE}/analytics/student/confidence?student_id=${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch confidence analytics');
    return res.json();
  }
};

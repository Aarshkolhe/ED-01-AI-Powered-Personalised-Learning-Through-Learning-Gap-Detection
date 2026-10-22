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
  correct_answer: string;
  worked_solution: string[];
  worked_solution_hi?: string[];
  difficulty: number;
}

export interface AnswerEvaluation {
  is_correct: boolean;
  correct_answer: string;
  concept_id: string;
  detected_misconception?: string;
  misconception_explanation?: string;
  ai_feedback?: string;
  previous_mastery: number;
  updated_mastery: number;
  mastery_change: number;
  is_mastered: boolean;
  response_time_seconds: number;
  time_signal: string;
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
    is_reassessment?: boolean;
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

  getStudentsSummary: async (): Promise<Record<string, unknown>[]> => {
    const res = await fetch(`${API_BASE}/analytics/students`);
    if (!res.ok) throw new Error('Failed to fetch students summary');
    return res.json();
  }
};

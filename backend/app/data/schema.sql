"""
Supabase PostgreSQL Schema and Row Level Security (RLS) Policies.
"""

SCHEMA_SQL = """
-- LearnLens AI Supabase PostgreSQL Schema

-- 1. Concepts
CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'beginner',
    "order" INTEGER NOT NULL,
    category TEXT DEFAULT 'Mathematics',
    mastery_threshold FLOAT DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Prerequisites
CREATE TABLE IF NOT EXISTS prerequisites (
    concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
    prerequisite_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
    PRIMARY KEY (concept_id, prerequisite_id)
);

-- 3. Questions
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    prompt_hi TEXT,
    question_type TEXT DEFAULT 'multiple_choice',
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    worked_solution JSONB DEFAULT '[]'::jsonb,
    difficulty FLOAT DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Student Mastery (BKT states)
CREATE TABLE IF NOT EXISTS student_mastery (
    student_id UUID NOT NULL,
    concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
    p_mastery FLOAT DEFAULT 0.20,
    practice_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (student_id, concept_id)
);

-- 5. Student Attempts
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    question_id TEXT REFERENCES questions(id),
    concept_id TEXT REFERENCES concepts(id),
    student_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    misconception_id TEXT,
    response_time_seconds FLOAT NOT NULL,
    is_reassessment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attempts ENABLE ROW LEVEL SECURITY;

-- Students can read & update their own records
CREATE POLICY "Students can read own mastery"
    ON student_mastery FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own attempts"
    ON student_attempts FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Teachers can view all student records in their classroom
CREATE POLICY "Teachers can view classroom mastery"
    ON student_mastery FOR SELECT
    USING (auth.jwt() ->> 'role' = 'teacher');

CREATE POLICY "Teachers can view classroom attempts"
    ON student_attempts FOR SELECT
    USING (auth.jwt() ->> 'role' = 'teacher');
"""

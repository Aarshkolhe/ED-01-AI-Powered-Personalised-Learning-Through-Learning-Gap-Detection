# LearnLens AI — Precision AI Learning Platform

> **Comprehensive Integration**: AI-Powered Personalised Learning Through Conceptual Learning Gap Detection, Bayesian Mastery Recovery, Metacognitive Calibration & Teacher Quality Gates.

LearnLens AI diagnoses *why* a student has made an error, isolates the conceptual misunderstanding using Bayesian Knowledge Tracing (BKT) and step-by-step mathematical reasoning, and automatically charts a prerequisite remediation path to close the gap.

---

## 🌟 Architecture & Key Highlights

### 1. Student Learning Portal
- **Diagnostic Quiz:** Multiple-choice items with misconception distractors, free-text reasoning input, and response-time pacing signals.
- **Confidence-Based Learning Insights (Feature A):** Students optionally specify confidence (Low, Medium, High). Detects overconfidence traps, underconfidence, conscious uncertainty, and mastery alignment. **Strictly isolated from BKT calculations** to preserve mathematical integrity.
- **BKT Engine:** Real-time Bayesian updates ($P(L_0), P(T), P(G), P(S)$) updating mastery probabilities per student and concept after every response.
- **Explainable Recommendations (Feature C):** Platform provides transparent, structured reason codes (`prerequisite_mastery_low`, `recent_error_pattern`, `mastery_uncertain`, `ready_for_harder_question`, `spaced_review_due`) alongside student-friendly explanations.
- **Spaced Revision & Intelligent Practice Scheduling (Feature B):** Expanding review intervals (1, 2, 4, 7, 14, 30 days; 1-day reset on error). Prioritizes concepts due for review with transparent rationales.
- **Student Content Reporting (Feature F):** Integrated "Report an issue" modal allowing students to flag incorrect answer keys, ambiguous wording, or formatting slips with student privacy preservation (masked IDs).
- **Step-by-Step Mistake Detector:** Pinpoints the exact index of faulty equation transformations and provides targeted algebraic corrections.
- **Targeted Misconception Generator:** Synthesizes verified diagnostic items with schema-validated distractors.
- **Recovery Learning Path:** Topologically orders prerequisites so foundational gaps are addressed before advancing.
- **Learning Recovery Score (LRS):** Compares pre-remediation baselines with fresh post-reassessment performance with transparent progress delta reporting.

### 2. Knowledge-Graph Explorer
- Interactive curriculum dependency graph built with **React Flow**.
- Displays real-time student mastery percentages, critical learning-gap highlights ($<60\%$), and dynamic animated prerequisite edges.

### 3. Teacher Diagnostic & Quality Gate Dashboard
- **Classroom Overview:** Live cohort metrics, total enrolled learners, and evidence-based at-risk indicators.
- **Concept Mastery Heatmap:** Recharts visualization of class-wide proficiency across mathematics concepts.
- **Shared Misconception Analytics:** Tracks frequency of recurring traps with affected student rosters.
- **Teacher Content Review Queue (Feature D):** Strict quality-gate workflow with content states (`draft`, `pending_review`, `approved`, `rejected`, `disabled`). Authorised teachers can inspect, approve, reject with reason, or quarantine questions. Unapproved questions are quarantined from students.
- **Reported Issues Center (Feature F):** Teachers review student feedback and can quarantine questions, dismiss issues, or mark resolved.

### 4. Automated Learning-Engine Evaluation Suite (Feature E)
- Deterministic benchmark suite validating step mistake detection, question schema validity, BKT monotonicity, confidence non-interference, and recommendation traceability.
- Outputs per-category Precision, Recall, F1, sample sizes ($n$), and regression thresholds without requiring external LLM API calls.

---

## 🛠️ Technology Stack

- **Backend:** Python 3.13+, FastAPI, Pydantic v2, Pytest.
- **Frontend:** Next.js (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, React Flow (`@xyflow/react`), Recharts, Lucide Icons.
- **Storage:** Local resilient repository with PostgreSQL/Supabase schema & Row Level Security (RLS) migrations.
- **AI Engine:** Google Gemini 2.5 Flash API with deterministic fallback safety engine for credential-free offline execution.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python:** 3.10+ (Tested on Python 3.13 / 3.14)
- **Node.js:** v18+ (Tested on v24 / npm 11+)

### 2. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Key configuration parameters:
- `DEMO_MODE=true` (Runs locally without external credentials required)
- `DATABASE_MODE=local` (or `supabase`)
- `GEMINI_API_KEY=` (Optional: Provide your Gemini API key to activate live generative explanations)
- `FRONTEND_URL=http://localhost:3000`
- `BACKEND_URL=http://localhost:8000`

### 3. Backend Setup & Startup
Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Run all unit tests:
```bash
# In backend directory:
pytest tests -v
```

Run the automated evaluation benchmark suite:
```bash
# In backend directory:
python run_eval.py
```

Start the FastAPI backend server:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation is live at: `http://localhost:8000/api/docs`.

### 4. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & End-to-End Walkthrough

1. **Visit Landing Page:** Navigate to `http://localhost:3000` to review problem statements, architectural components, and quick-launch links.
2. **Student Portal (`/student`):**
   - Take the **Diagnostic Quiz** on *Adding Fractions (Unlike Denominators)*.
   - Select confidence: **Low**, **Medium**, or **High** (or leave unselected).
   - Select `2/5` to trigger the *Adding Across Denominators* trap.
   - Notice the **Confidence Insight Card** (highlighting overconfidence/underconfidence guidance), BKT mastery update, and response-time signal.
   - Click the flag icon to test **Student Content Reporting** (e.g. submit an issue report).
   - Switch to the **Spaced Revision** tab to inspect the prioritized due queue and practice scheduling intervals.
   - Switch to the **Knowledge Graph** tab to see real-time mastery illumination and dependency edges.
   - Open the **Remediation Path** tab to see topologically sorted prerequisite review steps.
   - Launch a **Fresh Reassessment** and solve the post-test question correctly (`11/12`) to verify the **Learning Recovery Score (+100% LRS)**.
   - Test the **Step Mistake Detector** on `2x + 6 = 20` with erroneous step `2x = 26` to see step 1 flagged with sign reversal correction.
3. **Teacher Diagnostic Center (`/teacher`):**
   - View **Classroom Analytics**: cohort average mastery, Concept Mastery Heatmap, top shared misconceptions, and student roster.
   - Switch to the **AI Content Quality Gate** tab: inspect generated questions, approve, reject (with required reason), or quarantine.
   - Switch to the **Reported Issues** tab: inspect student issue reports and take quarantine or dismissal actions.
4. **Automated Evaluation Suite:**
   - Execute `python backend/run_eval.py` to see 100% passed deterministic evaluation across all 4 key algorithmic areas.

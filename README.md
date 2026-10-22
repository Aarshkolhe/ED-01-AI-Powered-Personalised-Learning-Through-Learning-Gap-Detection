# LearnLens AI — Precision AI Learning Platform

> **Hackathon Deliverable**: AI-Powered Personalised Learning Through Conceptual Learning Gap Detection & Bayesian Mastery Recovery.

LearnLens AI diagnoses *why* a student has made an error, isolates the conceptual misunderstanding using Bayesian Knowledge Tracing (BKT) and step-by-step mathematical reasoning, and automatically charts a prerequisite remediation path to close the gap.

---

## 🌟 Architecture & Key Highlights

1. **Student Learning Portal**
   - **Diagnostic Quiz:** Multiple-choice items with misconception distractors, free-text reasoning input, and response-time pacing signals.
   - **BKT Engine:** Real-time Bayesian updates ($P(L_0), P(T), P(G), P(S)$) updating mastery probabilities per student and concept after every response.
   - **AI Conceptual Feedback:** Immediate student-friendly explanations in English and Hindi (हिन्दी) without prematurely revealing solutions.
   - **Step-by-Step Mistake Detector:** Pinpoints the exact index of faulty equation transformations and provides targeted algebraic corrections.
   - **Targeted Misconception Generator:** Synthesizes verified diagnostic items with schema-validated distractors.
   - **Recovery Learning Path:** Topologically orders prerequisites so foundational gaps are addressed before advancing.
   - **Learning Recovery Score (LRS):** Compares pre-remediation baselines with fresh post-reassessment performance with transparent progress delta reporting.

2. **Knowledge-Graph Explorer**
   - Interactive curriculum dependency graph built with **React Flow**.
   - Displays real-time student mastery percentages, critical learning-gap highlights ($<60\%$), and dynamic animated prerequisite edges.

3. **Teacher Analytics Dashboard**
   - **Classroom Overview:** Live cohort metrics, total enrolled learners, and evidence-based at-risk indicators.
   - **Concept Mastery Heatmap:** Recharts visualization of class-wide proficiency across mathematics concepts.
   - **Shared Misconception Analytics:** Tracks frequency of recurring traps (e.g., adding across denominators) with affected student rosters.
   - **Pedagogical Interventions:** Actionable instructional recommendations linked to observed error patterns.

---

## 🛠️ Technology Stack

- **Backend:** Python 3.14, FastAPI, Pydantic v2, Google GenAI SDK (`google-genai`), Pytest.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, React Flow (`@xyflow/react`), Recharts, Lucide Icons.
- **Database & Auth:** Local resilient repository with PostgreSQL/Supabase schema & Row Level Security (RLS) migrations.
- **AI Engine:** Google Gemini 2.5 Flash API with deterministic fallback safety engine for credential-free offline execution.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python:** 3.10+ (Tested on Python 3.14)
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

Run backend unit test suite:
```bash
# Set PYTHONPATH to backend directory
pytest tests -v
```

Start the FastAPI backend server:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/api/docs`.

### 4. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & End-to-End Walkthrough

1. **Visit Landing Page:** Navigate to `http://localhost:3000` to review problem statements, architectural components, and quick-launch links.
2. **Student Portal:**
   - Go to `/student`.
   - Take the **Diagnostic Quiz** on *Adding Fractions (Unlike Denominators)*. Select `2/5` to trigger the *Adding Across Denominators* trap.
   - Notice the BKT mastery drop, response time pacing signal, and AI remediation hint.
   - Switch to the **Knowledge Graph** tab to see `fraction_addition_unlike` illuminated with a red Gap badge and animated prerequisite edges.
   - Open the **Remediation Path** tab to see topologically sorted prerequisite review steps.
   - Launch a **Fresh Reassessment** and solve the post-test question correctly (`11/12`) to verify the **Learning Recovery Score (+100% LRS)**.
   - Test the **Step Mistake Detector** on `2x + 6 = 20` with erroneous step `2x = 26` to see step 1 flagged with sign reversal correction.
3. **Teacher Analytics:**
   - Navigate to `/teacher`.
   - Inspect cohort average mastery, the Concept Mastery Heatmap (Recharts), top shared misconceptions, and automated pedagogical intervention suggestions.

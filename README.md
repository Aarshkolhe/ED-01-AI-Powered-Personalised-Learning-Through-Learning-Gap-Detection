# LearnLens AI — Precision AI-Powered Personalised Learning Platform

> **Comprehensive Integration**: AI-Powered Personalised Learning Through Conceptual Learning Gap Detection, Bayesian Knowledge Tracing (BKT), Metacognitive Calibration, Knowledge Graph Dependency Mapping, and Teacher Quality Gates.

LearnLens AI diagnoses *why* a student has made an error, isolates the conceptual misunderstanding using Bayesian Knowledge Tracing (BKT) and step-by-step mathematical reasoning, and automatically charts an explainable prerequisite remediation path to close the gap.

---

## 🌟 Architecture & Core Features (F1–F7 & Reliability Additions)

### 1. Feature 1 (F1): AI-Powered Learning-Gap & Misconception Detection
- **Controlled Error Taxonomy:** Standardized classification (`prerequisite_gap`, `concept_misunderstanding`, `formula_confusion`, `arithmetic_or_sign_error`, `possible_typo`, and `insufficient_evidence`).
- **Diagnostic Follow-Up Clarification (Spec §18.3, §19):** Ambiguous responses trigger targeted follow-up questions to differentiate competing misconceptions, with strict single-depth loop prevention.
- **Evidence-Based:** An incorrect answer alone never diagnoses a definitive misconception; returns `insufficient_evidence` when evidence is ambiguous or sparse.
- **Offline Fallback:** 100% deterministic local rules with optional Gemini structured output verification.

### 2. Feature 2 (F2): Adaptive Assessments, Real-Time Feedback & Answer Secrecy
- **Answer Secrecy Prior to Submission (Spec §7, §20):** `StudentQuestion` endpoint response model strictly redacts `correct_answer`, `worked_solution`, and option trap metadata prior to submission.
- **Post-Submission Feedback:** Step-by-step worked solutions and AI pedagogical feedback are revealed only after submission.
- **Idempotency Protection:** Prevents duplicate submissions from inflating BKT mastery.

### 3. Feature 3 (F3): Bayesian Knowledge Tracing (BKT)
- **Standalone Versioned Engine:** Model v1.0.0 with documented prototype parameters:
  - Prior Knowledge: $P(L_0) = 0.20$
  - Learning / Transition Rate: $P(T) = 0.15$
  - Guessing Probability: $P(G) = 0.20$
  - Slip Probability: $P(S) = 0.10$
  - Configuration endpoint: `GET /api/model/bkt/config`
- **Metacognitive Confidence Isolation (Spec §18.2):** Optional self-reported confidence (`low`, `medium`, `high`) provides meta-cognitive learning insights (overconfidence/underconfidence), but **never modifies BKT mastery probabilities**.

### 4. Feature 4 (F4): Interactive Knowledge Graph & Accessible View
- **Dual Visual Modes:** Interactive React Flow canvas (`@xyflow/react`) complemented by an **Accessible Linear Structured List View** for keyboard-only and screen-reader navigation.
- **Text-Based Status Badges:** Visual color cues are reinforced by explicit text labels: `Mastered (≥85%)`, `In Progress`, and `Needs Practice (<60%)`.
- **Acyclic Graph Integrity:** Tarjan/DFS 3-color back-edge cycle detection ensures the curriculum forms a strict Directed Acyclic Graph (DAG) via `GET /api/graph/validate`.

### 5. Feature 5 (F5): Personalized Learning Paths & Explainable Recommendations
- **Structured Reason Codes (Spec §18.7):** Platform provides transparent, machine-readable reason codes (`spaced_review_due`, `prerequisite_mastery_low`, `recent_error_pattern`, `mastery_uncertain`, `ready_for_harder_question`) with plain-language explanations.
- **Strict Concept Alignment:** Recommendation logic strictly targets the focal concept without stale cross-concept bleed.

### 6. Feature 6 (F6): Teacher Dashboard & Fair Support Signals
- **Classroom Overview:** Live cohort metrics, total enrolled learners, and curriculum mastery heatmaps (Recharts).
- **Fair, Non-Stigmatizing Support Signals (Spec §18.6):** Replaced punitive "high risk" labels with 4 actionable states: `Needs Support`, `Monitoring`, `On Track`, and `Insufficient Data`. Requires $N \ge 3$ diagnostic attempts before assigning support signals.
- **AI Content Review Quality Gate (Spec §18.4):** Teacher moderation queue (`pending_review`, `approved`, `rejected`, `disabled`). Unapproved AI questions are quarantined from students.
- **Student Content Reporting (Spec §20):** Integrated modal allowing students to flag incorrect answer keys or typos, with a teacher resolution queue.

### 7. Feature 7 (F7): Reassessment & Honest Progress Tracking
- **Comparable Fresh Reassessment:** Post-remediation assessment uses fresh comparable questions.
- **Honest Learning Recovery Score (LRS):**
  - If reassessment is not yet taken: states `Awaiting Reassessment` ($0.0\%$). Never generates false 100% recovery!
  - If student answers incorrectly on reassessment (e.g. `1/6` on `1/2 + 1/3`): reports $0.0\%$ recovery with status `Needs Further Practice`.
  - If student succeeds on reassessment (e.g. `5/6` on `1/2 + 1/3`): reports $100.0\%$ recovery with status `Significant Recovery`.
  - Transparently handles zero baselines and small sample sizes.

---

## 🛠️ Resolved Testing & Integration Issues

1. **Issue A (Incorrect Recovery Score):**
   - *Problem:* Submitting `1/6` on `1/2 + 1/3` previously produced 100% recovery because backend defaulted `post_scores = [1.0]` when no reassessment had been taken.
   - *Fix:* Eliminated artificial fallback in `routes.py`, updated `recovery_engine.py` to return `Awaiting Reassessment` ($0.0\%$), and verified that wrong answers on reassessment report $0.0\%$ recovery and `Needs Further Practice`.
2. **Issue B (Misconception Mismatch):**
   - *Problem:* Recommendation explanation referred to "missing sign reversal in equation isolation" while the displayed question concerned fraction addition.
   - *Fix:* Resolved query parameter discrepancy (`target_concept_id` vs `concept_id`) in `routes.py`, aligned `RecommendationService` to strictly check target concept errors, and added dynamic concept-to-misconception binding in `MisconceptionGenerator.tsx` and `ai_service.py`.
3. **Issue C (Responsive Layout Overflow):**
   - *Problem:* The recovery dashboard and metrics cards caused horizontal overflow beyond the viewport at 1280px and 1366px screen widths.
   - *Fix:* Introduced `compact` mode for sidebar placement in `RecoveryScoreCard.tsx`, added `min-w-0`, `overflow-hidden`, and flex-wrapping on metric values, and updated `RecoveryPathView.tsx` with responsive grid layouts.

---

## 💻 Local Setup & Running Instructions (Windows PowerShell)

### Prerequisites
- **Python:** 3.10+ (Tested with Python 3.13)
- **Node.js:** 18+ (Tested with Node.js 22 / 24)

### 1. Environment Configuration
Create a `.env` file in the project root:
```powershell
Copy-Item .env.example .env
```
Default offline configuration (`.env`):
```env
DEMO_MODE=true
DATABASE_MODE=local
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
# Optional: GEMINI_API_KEY=your_key_here (Offline fallback works 100% without key)
```

### 2. Backend Setup & Run (FastAPI)
Open a Windows PowerShell terminal:
```powershell
cd backend

# Set Python module path
$env:PYTHONPATH = (Get-Location).Path

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run all 33 unit and integration tests
python -m pytest tests -v

# Run the 6-phase learning-engine evaluation benchmark
python run_eval.py

# Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger API Documentation:* [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup & Run (Next.js 16)
Open a second Windows PowerShell terminal:
```powershell
cd frontend

# Install dependencies
npm.cmd install --legacy-peer-deps

# Verify production Turbopack build
npm.cmd run build

# Start the development server
npm.cmd run dev
```
*Frontend Application:* [http://localhost:3000](http://localhost:3000)

---

## 🧪 Step-by-Step End-to-End Walkthrough

### Student Workflow (`http://localhost:3000/student`)
1. **Diagnostic Quiz:**
   - Topic: *Adding Fractions (Unlike Denominators)* (`1/2 + 1/3`).
   - Select optional confidence level: **High**.
   - Select answer `1/6` (triggering the *Cross-Multiplication in Addition* trap).
   - Click **Submit Answer**.
   - Verify: Graded as **Incorrect**, detected trap is *Cross-Multiplication in Addition*, confidence insight warns about overconfidence, and step-by-step worked solution is revealed.
2. **Diagnostic Follow-Up Disambiguation:**
   - If an ambiguous answer is selected, an interactive follow-up clarification card appears to pinpoint the concept without looping.
3. **Knowledge Graph & Accessible View:**
   - Switch to the **Knowledge Graph** tab.
   - Toggle between **Interactive Canvas** and **Accessible List View** (featuring text-based badges `Needs Practice`, `Mastered`, and prerequisite dependencies).
4. **Spaced Revision:**
   - Switch to the **Spaced Revision** tab to review concepts prioritized by mastery decay.
5. **Remediation & Fresh Reassessment:**
   - Switch to the **Remediation Path** tab to review topological prerequisite steps.
   - Notice the **Recovery Score Card**: states `Awaiting Reassessment` ($0.0\%$), honestly explaining that post-reassessment is pending.
   - Click **Launch Fresh Reassessment**.
   - Answer the reassessment question with `5/6` (correct).
   - Observe **Learning Recovery Score (+100.0% LRS)** with status `Significant Recovery`.

### Teacher Workflow (`http://localhost:3000/teacher`)
1. **Classroom Analytics:**
   - View cohort average mastery and Concept Mastery Heatmap.
   - Inspect top shared classroom misconceptions and pedagogical interventions.
2. **Student Roster & Fair Support Signals:**
   - Inspect student list with transparent support signals: `Needs Support`, `Monitoring`, `On Track`, and `Insufficient Data` (with attempt counts and exact evidence summary).
3. **AI Content Quality Gate:**
   - Switch to the **AI Content Quality Gate** tab to review generated questions. Approve or Reject with feedback.
4. **Reported Issues Center:**
   - Switch to the **Reported Issues** tab to review student-submitted flags and quarantine flawed questions.

---

## 📊 Verification Test Suite Results

- **Backend Pytest Suite:** **33 / 33 tests passing (100%)** in 1.03s.
  - `test_backend.py`: BKT formulas, step detector, recovery engine, question verification (7 tests).
  - `test_evaluation_suite.py`: Multi-phase learning engine evaluation (7 tests).
  - `test_features.py`: Metacognitive confidence, spaced revision, reason codes, teacher review, student quarantine (7 tests).
  - `test_spec_additions.py`: Answer secrecy, graph cycle detection, diagnostic follow-ups, fair support signals (4 tests).
  - `test_local_issues_and_remediation.py`: Fraction grading (`1/6` vs `5/6`), honest recovery score before/after reassessment, zero baseline handling, and recommendation concept alignment (8 tests).
- **Automated Learning-Engine Evaluation Benchmark:** **6 / 6 phases passing (100% accuracy, Precision=1.0, Recall=1.0, F1=1.0)**.
- **Frontend Next.js Build:** Compiled successfully with **0 errors and 0 type warnings** across all routes (`/`, `/student`, `/teacher`, `/auth`).

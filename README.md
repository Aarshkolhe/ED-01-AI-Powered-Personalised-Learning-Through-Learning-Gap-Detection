# LearnLens AI — Real AI-Powered Personalised Learning Platform Using xAI Grok

> **Comprehensive Multi-Subject Platform**: AI-Powered Personalised Learning Through Conceptual Learning Gap Detection, Bayesian Knowledge Tracing (BKT), xAI Grok Generative Tutor, Dynamic Multi-Subject Lesson Generation, Dynamic Assessment Engine, Metacognitive Calibration, Knowledge Graph Dependency Mapping, and Teacher Quality Gates.

LearnLens AI transforms beyond rigid fractions into a production-grade, multi-subject AI learning platform. Students can study arbitrary subjects and topics (Mathematics, Physics, Chemistry, Biology, Computer Science, and custom user-entered topics), ask questions in natural language, receive adaptive explanations, practice with dynamically generated assessments under strict answer secrecy, and track genuine mastery growth.

---

## 🌟 xAI Grok Integration & Generative Architecture

### 1. Official xAI Grok Provider Layer
- **Official Endpoint:** `https://api.x.ai/v1/chat/completions` (OpenAI-compatible request/response envelope).
- **Environment Configuration:**
  - `XAI_API_KEY`: Secret API key read strictly on the server; never exposed to clients, browser requests, Git, or logs.
  - `XAI_MODEL`: Configurable model name (defaults to `grok-2-latest`; also supports `grok-beta`, `grok-2-vision-1212`).
  - `XAI_BASE_URL`: `https://api.x.ai/v1`.
  - `XAI_TIMEOUT_SECONDS`: Bounded timeout (15.0s) with 2 retries and exponential backoff for transient errors.
- **Provider Health Endpoint:** `GET /api/ai/health` verifies connectivity and model readiness without leaking API secrets. Returns clear statuses: `ready`, `missing_key`, `invalid_key`, `rate_limited`, or `offline_fallback`.
- **Zero-Crash Deterministic Fallback:** When `XAI_API_KEY` is absent or quota is exhausted, the application gracefully activates high-reliability multi-subject curated engines with explicit `is_fallback: true` tags.

### 2. Interactive AI Tutor (Arbitrary Subjects & Multi-Turn Context)
- **Multi-Subject Domain Support:** Mathematics, Physics, Chemistry, Biology, Computer Science, and custom user-entered concepts.
- **Pedagogical Levels:** Beginner, Intermediate, and Advanced.
- **Quick Action Prompt Modifiers:**
  - 💡 *Simplify Explanation:* Breaks concepts down into fundamental intuitions.
  - 🔍 *Worked Example:* Provides a comprehensive step-by-step solved calculation.
  - 🌐 *Real-World Analogy:* Explains mechanisms using memorable physical analogies.
  - 📝 *Practice Check:* Formulates a targeted exercise to test immediate comprehension.
  - 📌 *Key Takeaways:* Bulleted summary of invariant governing rules.
- **Suggested Follow-Ups:** AI-generated next-question chips allow students to explore deeper with a single click.
- **LaTeX Math & Code Formatting:** Equations rendered in LaTeX ($...$ and $$...$$) and code blocks with syntax highlighting.

### 3. Dynamic Lesson Generation Studio
- **Structured Schema:** Validated against `DynamicLesson` schema:
  - Learning objectives & prerequisite knowledge.
  - Core theory with conceptual invariants.
  - Step-by-step worked examples with expandable steps.
  - Common mistakes and misconceptions with "Why it happens" and "How to fix".
  - Practice questions with revealable hints and full solutions.
  - Concise summary and recommended next steps.
- **Regenerate & Adjust:** Students can toggle difficulty or request another explanation without restarting their session.

### 4. Dynamic Assessment Engine & Strict Answer Secrecy
- **Answer Secrecy Prior to Submission (Spec §7, §20):** `POST /api/assessments/generate-dynamic` delivers `StudentQuestion` objects with `correct_answer` and `worked_solution` strictly stripped from both payloads and DOM.
- **Server-Side Grading:** `POST /api/assessments/submit-dynamic` verifies answers against server-stored session keys.
- **Safe Solution Disclosure:** Step-by-step worked solutions, misconception explanations, and confidence insights are safely revealed post-submission.
- **Fresh Reassessment:** Students can generate new, comparable diagnostic items on the same or higher difficulty.

### 5. Generalized Misconception Taxonomy Across Subjects
- **Extended Taxonomy:**
  - Mathematics: `add_denominators`, `cross_multiply_in_addition`, `sign_flip_omission`, `unlike_terms_merging`.
  - Physics: `force_implies_velocity`, `heavier_falls_faster`, `current_consumed`.
  - Chemistry: `mixing_equals_reaction`, `mass_destruction_in_burning`.
  - Computer Science: `off_by_one_indexing`, `assignment_vs_equality`, `pass_by_value_object_mutation`.
  - Controlled Categories: `arithmetic_or_sign_error`, `concept_misunderstanding`, `formula_confusion`, `prerequisite_gap`, `possible_typo`, `question_misread`, `insufficient_evidence`.
- **Uncertainty Safeguards:** Low diagnostic confidence (< 60%), blank inputs, or unmatched patterns return `insufficient_evidence`. A single incorrect answer never permanently diagnoses a misconception.

### 6. BKT Independence & Knowledge Graph Protection
- **Mathematical Integrity:** BKT mastery updates are computed purely from valid graded attempts. **Student confidence ratings and Grok free-form opinions never modify BKT probabilities.**
- **Non-Pollution of Graph:** Custom or student-requested topics are tracked in the multi-subject topic catalog (`status: community_requested`) and never inject unverified prerequisite edges into the authoritative knowledge graph.

### 7. Teacher Dashboard AI Content Quality Gate
- **Dynamic Content Moderation:** Teachers can review AI-generated lessons and dynamic questions.
- **Actions:** Approve, Reject with pedagogical rationale, or Quarantine/Disable.
- **Traceable Misconception Evidence:** Inspect attempt logs, student confidence, and exact cognitive discrepancy patterns.

---

## 💻 Local Setup & Running Instructions (Windows PowerShell)

### Prerequisites
- **Python:** 3.10+ (Tested on Python 3.13)
- **Node.js:** 18+ (Tested on Node.js 22 / 24)

### 1. Environment Configuration
Create or configure your environment file:
```powershell
# Copy the provided template to .env (or backend/.env)
Copy-Item .env.example .env
```

To enable live xAI Grok generative capabilities, configure `XAI_API_KEY` in your `.env` or set it in your PowerShell session:
```powershell
# In Windows PowerShell:
$env:XAI_API_KEY = "xai-your-api-key-here"
$env:XAI_MODEL = "grok-2-latest"   # Default model (or grok-beta)
```
*(Note: If no API key is provided, the application automatically runs in 100% deterministic offline fallback mode with multi-subject curriculum support).*

### 2. Backend Setup & Run (FastAPI)
Open a Windows PowerShell terminal:
```powershell
cd backend

# Set Python module path
$env:PYTHONPATH = (Get-Location).Path

# Install dependencies
pip install -r requirements.txt

# Run all 45 automated unit, regression, and Grok integration tests
python -m pytest tests -v

# Run the 6-phase learning-engine evaluation benchmark
python run_eval.py

# Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger API Documentation:* [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
*AI Health Check Endpoint:* [http://127.0.0.1:8000/api/ai/health](http://127.0.0.1:8000/api/ai/health)

### 3. Frontend Setup & Run (Next.js 16 / Turbopack)
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

## 🧪 End-to-End Walkthrough of New Capabilities

### 1. Grok AI Personal Tutor (`http://localhost:3000/student` -> "Grok AI Tutor" Tab)
1. Check the top status indicator: displays `xAI Grok Active (grok-2-latest)` when credentials are present, or `Deterministic Fallback Engine` when offline.
2. Select any subject from the dropdown (e.g. **Physics**, **Computer Science**, **Chemistry**).
3. Enter or select a topic (e.g. `Newton's Laws & Mechanics` or `Recursion & Big-O`).
4. Type any natural language question (e.g. *"Why is an object's velocity constant if net force is zero?"*).
5. Click **💡 Simplify** or **🔍 Worked Example** to alter the explanation style dynamically.
6. Click any of the **Suggested Next Questions** chips to continue learning.

### 2. Dynamic Lesson Studio (`http://localhost:3000/student` -> "Dynamic Lessons & Quiz" Tab)
1. Select target subject and enter a custom topic (e.g. `Chemical Bonding` or `Dynamic Programming`).
2. Click **Generate Structured Lesson**.
3. View the generated lesson:
   - Check the **Learning Objectives** and **Prerequisites**.
   - Read the **Core Theory & Invariants**.
   - Expand the **Step-by-Step Worked Examples**.
   - Review **Common Mistakes & Misconceptions** (with *"Why it happens"* and *"How to fix"*).
   - Test comprehension with the embedded **Practice Checks** (click *"Reveal Solution"*).
4. Click **Take Diagnostic Assessment** to immediately launch a test based on the lesson!

### 3. Dynamic Assessment Engine (With Answer Secrecy)
1. Switch to the **Dynamic Assessment Engine** sub-tab.
2. Select question count (e.g. 3 questions) and difficulty scale (e.g. 60%).
3. Click **Start Diagnostic Assessment**.
4. Notice that question cards display prompts and options **without exposing correct answers in the DOM or network response**.
5. Select an answer, choose your confidence level (**Low**, **Medium**, or **High**), and optionally input your reasoning.
6. Click **Submit Answers for Evaluation**.
7. Observe the comprehensive results report:
   - Graded score and percentage.
   - Per-question correct answer and **Full Step Solution**.
   - Cognitive insight on any detected misconception.
   - Metacognitive confidence insight card (overconfidence/underconfidence warning).
8. Click **Start Fresh Reassessment** to practice with brand new questions!

### 4. Teacher Content Moderation (`http://localhost:3000/teacher` -> "AI Content Quality Gate")
1. Open the teacher review queue.
2. Toggle between **Questions** and **Lessons**.
3. For dynamic lessons, review the lesson metadata and click **Approve Lesson**, **Reject**, or **Disable**.

---

## 📊 Verification Test Suite Results

- **Backend Pytest Suite:** **45 / 45 tests passing (100%)** in 1.01s:
  - `test_grok_integration.py` (12 tests): Provider health with missing/valid/invalid keys, tutor conversational flow and fallback, dynamic lesson schema validation, assessment answer secrecy, dynamic submission grading, BKT non-interference, generalized misconception rules across subjects, topic catalog custom requests, and teacher dynamic content moderation.
  - `test_backend.py` (7 tests): BKT equations, step detector, recovery engine, question generation.
  - `test_evaluation_suite.py` (7 tests): Automated learning-engine benchmark integration.
  - `test_features.py` (7 tests): Confidence calibration, spaced revision, reason codes, teacher review queue, student quarantine.
  - `test_spec_additions.py` (4 tests): Answer secrecy, graph cycle detection, diagnostic follow-ups, fair support signals.
  - `test_local_issues_and_remediation.py` (8 tests): Fraction grading, honest recovery score calculation, zero baseline handling, and recommendation concept alignment.
- **Automated Learning-Engine Evaluation Benchmark:** **6 / 6 phases passing (100% accuracy, Precision=1.0, Recall=1.0, F1=1.0)**.
- **Frontend Production Build:** **Compiled successfully with 0 errors and 0 warnings** in Next.js 16.4.2 Turbopack across all pages (`/`, `/student`, `/teacher`, `/auth`).

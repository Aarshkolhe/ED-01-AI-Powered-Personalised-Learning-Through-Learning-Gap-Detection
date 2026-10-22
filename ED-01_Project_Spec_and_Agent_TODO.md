# ED-01 — AI-Powered Personalised Learning Through Learning-Gap Detection

> **Purpose:** Shared product specification and implementation checklist for multiple AI coding agents.  
> **Status:** Planning — implementation has not started.  
> **Source of truth:** Keep this file updated as decisions are made. Agents must read it before changing code.

---

## 1. Product vision

Build an AI-powered learning platform that identifies **why a student may be struggling with a concept**, detects likely prerequisite gaps, and provides targeted instruction and practice. Teachers can see individual progress and class-level misconceptions.

A conventional quiz marks an answer right or wrong. A general chatbot responds to questions. ED-01 connects assessment, concept relationships, learning-state estimation, targeted feedback, adaptive practice, and measurable reassessment.

**Core promise:** Find the likely learning gap, teach the missing concept, and check whether the student improved.

### MVP principles
- Build one complete, reliable learning journey before expanding scope.
- Treat AI-detected misconceptions as hypotheses, not certain diagnoses.
- Use transparent, testable learning logic wherever possible.
- Do not fabricate learning gains, student data, or teacher insights.
- Keep student data private and restrict teacher views to authorized classes.
- Prioritize a clear, working demonstration over a large set of incomplete features.

### Non-goals for the MVP
- General-purpose LMS, video hosting, attendance, payments, or social features.
- Training a foundation model from scratch.
- Multiple subjects before one subject works end to end.
- Advanced Deep Knowledge Tracing (DKT) unless the core product is stable and suitable interaction data exists.
- Claims that one wrong answer reveals a student's exact thought process.

---

## 2. Users and roles

### Student
- Starts or resumes a learning session.
- Answers diagnostic and practice questions.
- Can submit working steps or select a confidence/uncertainty option where supported.
- Receives targeted explanations and practice.
- Sees their own concept mastery and progress.

### Teacher
- Views concept mastery and common error patterns for their class.
- Identifies students who may need additional support.
- Opens an individual student's progress summary when authorized.
- Sees inferred misconceptions as **possible explanations**, not definitive judgments.

### Demo/admin role
- Loads the curated concept map and question bank.
- Manages demo classes/users if authentication is included.
- Must not bypass normal authorization or expose student data unnecessarily.

---

## 3. Recommended MVP scope

### First subject and concept chain
Start with **school-level algebra**, using a small curated concept graph such as:

`Basic Algebra → Factorization → Quadratic Equations`

The exact question bank and curriculum level can be refined later. Store concept relationships as data rather than hard-coding them into UI components.

### Required end-to-end demonstration
1. Student starts a short diagnostic quiz.
2. Student answers a question incorrectly and, where possible, submits working steps.
3. System detects a likely error category and explains its confidence/evidence.
4. System checks prerequisite concepts in the knowledge graph.
5. BKT updates the student's mastery estimate for the relevant concept(s).
6. Student receives a personalized explanation and a targeted practice question.
7. The next question adapts to the student's observed performance.
8. Student completes a reassessment.
9. Student progress updates with a before/after view based on actual attempts.
10. Teacher dashboard reflects the student's updated mastery and class-level patterns.

**Acceptance criterion:** The entire flow must work with seeded demo data and a real sequence of answers. Do not make the demo depend on an external AI provider being available; provide a clearly labelled deterministic fallback for optional AI features.

---

## 4. Required features and tasks

Use `[ ]` for not started, `[/]` for in progress, and `[x]` for verified complete. Agents must only mark tasks complete after implementing and testing them.

### F1. AI-based learning-gap and misconception detection
- [ ] Define a controlled taxonomy of error types, e.g. prerequisite gap, concept misunderstanding, formula confusion, arithmetic slip, and unclear/insufficient evidence.
- [ ] Design question metadata that maps each question to one or more concepts and expected reasoning steps.
- [ ] Implement deterministic checks for known answer patterns and common misconceptions.
- [ ] Add optional AI analysis of answer/worked steps with a strict structured output schema.
- [ ] Return a likely misconception, evidence, confidence/uncertainty, and recommended next step.
- [ ] Never present a guess as a confirmed fact; allow “not enough evidence”.
- [ ] Test correct answers, common wrong answers, blank answers, malformed AI output, and provider failure.

**Acceptance criteria**
- An incorrect answer is not automatically treated as proof of a misconception.
- Detection results include the concept, inferred error category, supporting evidence, and uncertainty.
- AI output is validated server-side before it affects student state or UI.
- If AI fails, the core quiz and deterministic feedback still work.

### F2. Adaptive question generation with real-time feedback
- [ ] Create a curated question bank with difficulty, concept tags, expected answer, hints, explanation, and misconception tags.
- [ ] Implement question selection based on current mastery and recent attempts.
- [ ] Prefer prerequisite review when prerequisite mastery is low.
- [ ] Increase difficulty gradually when the student demonstrates mastery.
- [ ] Give feedback after submission without exposing the answer before the attempt.
- [ ] Add optional AI question generation constrained by the current concept, difficulty, and output schema.
- [ ] Validate generated questions and answers; use curated questions as fallback.
- [ ] Prevent repeated questions in the same short session unless repetition is intentional.

**Acceptance criteria**
- The next question has a traceable reason, e.g. “reviewing factorization because recent performance suggests it needs practice”.
- Student submissions update feedback and future question selection.
- Invalid generated content cannot break the learning flow.

### F3. Bayesian Knowledge Tracing (BKT) for concept mastery
- [ ] Implement a small, documented BKT module with parameters for initial knowledge, learning, guessing, and slipping.
- [ ] Choose and document sensible initial parameters; label them as prototype defaults unless calibrated with data.
- [ ] Update mastery after each relevant attempt using the BKT equations.
- [ ] Persist the mastery estimate and attempt history.
- [ ] Expose a readable mastery percentage/level in the student UI and teacher dashboard.
- [ ] Test the update calculations with known input/output examples.

**Acceptance criteria**
- Mastery changes as a result of actual attempts, not arbitrary UI increments.
- Updates are bounded to the valid probability range.
- The implementation and parameter meanings are documented.
- Do not claim prototype parameters are scientifically calibrated.

### F4. Interactive knowledge graph
- [ ] Define concept nodes and prerequisite edges in seed data.
- [ ] Represent concepts, prerequisite relationships, and optional learning resources in the data model.
- [ ] Render an interactive graph with node states such as not assessed, needs practice, developing, and mastered.
- [ ] Let students select a concept to see its explanation, prerequisites, and recommended activity.
- [ ] Visually distinguish prerequisite edges from other relationships if more types are added.
- [ ] Provide a useful list-based fallback for accessibility and small screens.

**Acceptance criteria**
- Graph content comes from the same source of truth as learning logic.
- A low-mastery prerequisite can be traced to a recommended next learning activity.
- Graph remains usable on typical laptop and mobile widths.

### F5. Personalized explanations, practice, and learning paths
- [ ] Create a reusable explanation format: concept, simple explanation, worked example, common mistake, and short check question.
- [ ] Build a learning-path selector using graph prerequisites and current mastery.
- [ ] Recommend prerequisite review when needed; otherwise continue with the target concept.
- [ ] Adapt explanation style or difficulty based on repeated errors.
- [ ] Add a “try a different explanation” action.
- [ ] Generate optional AI explanations using the known concept and detected error, not unbounded chat context.
- [ ] Ensure explanations are age-appropriate, mathematically checked where feasible, and do not reveal answers prematurely.

**Acceptance criteria**
- A recommendation explains why it was selected.
- Students can move from explanation to practice and back without losing progress.
- Curated fallback content exists for every concept in the MVP.

### F6. Teacher dashboard: mastery heatmap and at-risk insights
- [ ] Build a class overview with student rows and concept columns.
- [ ] Display mastery estimates with a legend and accessible text labels; do not rely on color alone.
- [ ] Show class-level concepts with the most observed difficulty.
- [ ] Show students who may benefit from support based on transparent rules, such as low mastery plus repeated recent errors.
- [ ] Allow an authorized teacher to open a student's concept-level history.
- [ ] Include attempt count and recency so a low-confidence estimate is not overstated.
- [ ] Add empty, loading, error, and no-class states.
- [ ] Ensure queries enforce teacher/class authorization on the server.

**Acceptance criteria**
- Dashboard metrics derive from persisted attempts and BKT estimates.
- “At risk” is described as a support signal, not a diagnosis or permanent label.
- No teacher can access another teacher's class or unauthorized student records.

### F7. Reassessment and progress tracking
- [ ] Store an immutable record for each submitted attempt, including timestamp, question, answer/result, concept tags, and feedback metadata.
- [ ] Provide a short reassessment after targeted instruction.
- [ ] Compare pre-learning and post-learning performance for the same concept or comparable questions.
- [ ] Show number of attempts and mastery estimates before and after.
- [ ] Clearly distinguish observed scores from estimated mastery.
- [ ] Avoid claiming causal improvement from a tiny or incomparable sample.
- [ ] Add a session summary with next recommended steps.

**Acceptance criteria**
- Before/after values come from actual stored attempts and BKT state.
- A user can refresh and still see saved progress.
- The UI explains when there is insufficient data for a meaningful comparison.

---

## 5. Suggested technical architecture

The team may adjust this after inspecting the repository, but agents must document any change here before making a major architectural shift.

### Proposed stack
- **Frontend:** React + Vite + TypeScript (or Next.js if the repository already uses it).
- **Backend:** Node.js + Express + TypeScript.
- **Database:** PostgreSQL.
- **ORM:** Prisma, if appropriate for the existing repository.
- **Charts:** a maintained React chart library.
- **Knowledge graph visualization:** a maintained graph library; keep graph data independent from rendering.
- **AI provider:** server-side provider adapter; API keys must never be exposed in browser code.
- **Testing:** unit tests for BKT/detection/selection, API tests for permissions and persistence, and an end-to-end test for the main learning flow.

**Important for agents:** Inspect the existing repository and package versions first. Reuse existing conventions where reasonable. Do not replace the stack or recreate the project without explicit approval.

### High-level architecture

`Student/Teacher UI → Backend API → Learning services → PostgreSQL`

Learning services:
- Attempt evaluation
- Misconception detection
- BKT mastery updates
- Knowledge-graph traversal
- Adaptive question selection
- Explanation/question-generation provider adapter
- Teacher analytics

AI is an optional service layer, not the source of truth for persistence, permissions, or mastery calculations.

---

## 6. Suggested data model

Use migrations and constraints; adjust names to fit existing conventions.

- **User:** id, display name, email/username, password hash if password auth is used, role, createdAt.
- **Classroom:** id, name, teacherId.
- **ClassroomMembership:** classroomId, studentId, joinedAt.
- **Concept:** id, key, title, description, subject, level.
- **ConceptPrerequisite:** conceptId, prerequisiteConceptId.
- **Question:** id, prompt, questionType, difficulty, expectedAnswer/rubric, explanation, hint, source (`curated`/`generated`), active.
- **QuestionConcept:** questionId, conceptId, weight or primary/secondary tag.
- **MisconceptionPattern:** id, conceptId, patternKey, description, remediationConceptId, optional rule metadata.
- **Attempt:** id, studentId, questionId, submittedAnswer, correctness, response metadata, createdAt.
- **AttemptConceptResult:** attemptId, conceptId, evidence/result metadata.
- **MisconceptionObservation:** attemptId, conceptId, category, evidence, confidence, source (`rule`/`AI`), createdAt.
- **StudentConceptMastery:** studentId, conceptId, masteryProbability, updatedAt.
- **LearningActivity:** id, conceptId, type, content, difficulty.
- **LearningSession:** id, studentId, startedAt, endedAt, targetConceptId.
- **SessionActivity:** sessionId, activity/question reference, order, outcome metadata.

Avoid duplicating data that can be derived reliably. Store enough attempt history to explain and reproduce mastery updates. Never store raw provider secrets in the database.

---

## 7. API boundary proposal

Exact routes may be adapted to the repository, but keep responsibilities separated and validate inputs/outputs.

### Student
- `GET /api/student/concepts` — concept graph and current student's mastery state.
- `POST /api/sessions` — start a learning session.
- `GET /api/sessions/:id/next-question` — select the next question.
- `POST /api/attempts` — validate and record an answer; update detection and BKT.
- `GET /api/student/progress` — mastery, attempts, and learning recommendations.
- `POST /api/sessions/:id/reassess` — start or submit a reassessment, depending on chosen API design.

### Teacher
- `GET /api/teacher/classes` — classes the current teacher is authorized to access.
- `GET /api/teacher/classes/:classId/overview` — aggregated mastery and error patterns.
- `GET /api/teacher/classes/:classId/students/:studentId` — authorized student detail.

### Engineering requirements
- Validate request bodies and query parameters.
- Authenticate and authorize on the server.
- Derive the student identity from the authenticated session/token, not a trusted client-supplied `studentId`.
- Avoid exposing correct answers in the question-fetch response before submission.
- Rate-limit AI-backed routes where appropriate.
- Use safe, structured error responses; do not leak stack traces or provider keys.
- Add request IDs/logging without logging sensitive answer text unnecessarily.

---

## 8. AI contract and failure handling

AI may help classify worked steps, explain concepts, or draft questions. The server must validate its output.

### Suggested misconception response shape

```json
{
  "conceptKey": "factorization",
  "category": "formula_confusion",
  "summary": "The submitted steps may confuse two factorization patterns.",
  "evidence": ["The second term was expanded with the wrong sign."],
  "confidence": 0.72,
  "needsMoreEvidence": false,
  "recommendedConceptKey": "basic_algebra",
  "recommendedAction": "show_contrastive_example"
}
```

This is an illustrative contract, not a requirement to use these exact enum names. Validate all enum values, lengths, probability bounds, and referenced concept IDs.

### Rules
- AI is not permitted to directly set mastery probability.
- BKT uses the evaluated correctness of an attempt and documented model parameters.
- Misconception detection can recommend a concept review, but should not override evidence from the attempt history silently.
- If the provider times out, returns invalid output, or is unavailable, fall back to curated questions and deterministic feedback.
- Do not put API keys in frontend environment variables that are shipped to the browser.
- Do not send personally identifying student data to an AI provider unless necessary, authorized, and documented.

---

## 9. Security, privacy, accessibility, and reliability

- [ ] Define role-based access rules for student, teacher, and admin/demo operations.
- [ ] Hash passwords with a suitable password-hashing algorithm if local passwords are implemented.
- [ ] Keep AI provider keys on the server.
- [ ] Validate and sanitize user input; render text safely.
- [ ] Enforce class membership and ownership checks in every teacher API.
- [ ] Keep secrets out of source control and provide `.env.example` with placeholders only.
- [ ] Use database migrations and seed scripts.
- [ ] Add sensible empty, loading, and error states.
- [ ] Make charts and graph states understandable without color alone.
- [ ] Ensure keyboard navigation and visible focus states for main flows.
- [ ] Avoid exposing private student details in logs.
- [ ] Document how to reset demo data.

---

## 10. UI pages

### Student experience
- [ ] Welcome / choose or resume learning session.
- [ ] Diagnostic and adaptive quiz page.
- [ ] Feedback and misconception explanation panel.
- [ ] Concept knowledge graph.
- [ ] Concept lesson with worked example and practice.
- [ ] Learning path and progress summary.
- [ ] Reassessment results with observed before/after evidence.

### Teacher experience
- [ ] Class overview.
- [ ] Concept mastery heatmap.
- [ ] Common misconception summary.
- [ ] Students needing support list with transparent criteria.
- [ ] Individual student progress detail.
- [ ] Empty/loading/error states.

### Shared
- [ ] Responsive layout.
- [ ] Consistent navigation and design system.
- [ ] Clear explanation of estimated mastery vs observed score.
- [ ] Demo mode or seed data that is visibly labelled as demo data.

---

## 11. Testing and definition of done

A feature is not done just because the UI renders.

### Required tests
- [ ] BKT unit tests for correct and incorrect responses, boundary values, and repeated attempts.
- [ ] Misconception tests for known answer patterns and insufficient evidence.
- [ ] Adaptive selection tests for prerequisite review and increasing difficulty.
- [ ] API tests for validation, persistence, authentication, and role authorization.
- [ ] Teacher data-isolation tests across classes.
- [ ] AI provider failure and invalid-output tests.
- [ ] End-to-end test of diagnostic → feedback → targeted practice → reassessment → teacher dashboard.
- [ ] Responsive and accessibility smoke test.

### Definition of done
A feature can be marked `[x]` only when:
1. The implementation exists.
2. It uses the agreed data/API contract.
3. Relevant tests pass.
4. Errors and empty states are handled.
5. No secrets or unauthorized data are exposed.
6. The agent reports files changed, tests run, results, and known limitations.

---

## 12. Multi-agent execution plan

Multiple agents should work on bounded tasks with explicit ownership. The coordinator agent owns integration and this document.

### Agent 0 — Coordinator / integrator
- [ ] Inspect the repository, identify existing stack and scripts, and report findings before making large changes.
- [ ] Confirm environment setup and the smallest vertical slice.
- [ ] Maintain this specification, task assignments, shared contracts, and integration order.
- [ ] Review conflicts and ensure the main branch stays runnable.
- [ ] Run full test/build checks before demo milestones.

### Agent 1 — Data model and backend foundation
- [ ] Implement schema, migrations, seed data, and environment validation.
- [ ] Implement authentication/role middleware if in MVP scope.
- [ ] Implement validated concept, question, session, and attempt APIs.
- [ ] Add authorization and persistence tests.
- **Owns:** database schema and core API contracts.

### Agent 2 — Learning engine
- [ ] Implement and test BKT as a standalone module.
- [ ] Implement deterministic misconception rules and confidence/insufficient-evidence behavior.
- [ ] Implement prerequisite traversal and adaptive question selection.
- [ ] Document formulas, parameters, and selection rules.
- **Owns:** learning logic; does not change UI or database schema without coordination.

### Agent 3 — Student UI
- [ ] Implement quiz, answer submission, feedback, targeted explanation, graph, and progress views.
- [ ] Integrate against the agreed API contract; use typed mock data only until endpoints are ready.
- [ ] Implement loading/error/empty states and responsive behavior.
- **Owns:** student-facing pages and components.

### Agent 4 — Teacher dashboard
- [ ] Implement class overview, mastery heatmap, common error patterns, and student detail.
- [ ] Use API-provided aggregates rather than calculating authoritative mastery in the browser.
- [ ] Include accessible labels, filters, and empty/loading/error states.
- **Owns:** teacher-facing pages and components.

### Agent 5 — AI integration and quality assurance
- [ ] Implement a server-side AI provider adapter only after the structured contract is agreed.
- [ ] Add schema validation, timeout/error handling, deterministic fallback, and provider-independent tests.
- [ ] Build seed scenarios and end-to-end tests for the complete demo flow.
- **Owns:** AI adapter and cross-feature QA. If the team has fewer agents, combine this with Agent 2 or Agent 0.

### Integration order
1. Coordinator confirms repository structure and shared types.
2. Agent 1 defines and merges schema/API contracts.
3. Agent 2 implements learning logic against those contracts.
4. Agents 3 and 4 implement UIs against stable typed contracts/mock data.
5. Agent 5 integrates optional AI and tests failure behavior.
6. Coordinator runs migrations, seed, tests, build, and the complete demo flow.

### Rules for all agents
- Read this file and inspect relevant existing files before editing.
- Do not overwrite another agent's work or change shared contracts unilaterally.
- Keep changes focused; avoid unrelated refactors.
- Do not install dependencies without explaining why and checking existing alternatives.
- Do not mark a task complete without testing it.
- If a requirement is ambiguous or a shared contract must change, report the proposed change before implementing it.
- After each task, report: **summary, files changed, tests run, results, known limitations, next tasks**.
- Keep the application buildable at each integration checkpoint.

---

## 13. Initial implementation checklist

### Phase 0 — Repository discovery
- [ ] Confirm repository and current branch.
- [ ] Inspect package files, app structure, scripts, and existing components.
- [ ] Identify environment variables and current database state without exposing secrets.
- [ ] Run existing tests and build; record baseline failures.
- [ ] Update this document with actual stack and decisions.

### Phase 1 — Vertical slice
- [ ] Seed 5–10 connected concepts and a small curated question bank.
- [ ] Build a student quiz that records an attempt.
- [ ] Evaluate answer and provide deterministic feedback.
- [ ] Update BKT mastery and persist the attempt.
- [ ] Recommend a targeted next question.
- [ ] Show the updated concept mastery.
- [ ] Verify the flow from a clean database.

### Phase 2 — Core learning features
- [ ] Add misconception taxonomy and evidence-based detection.
- [ ] Add prerequisite knowledge graph UI.
- [ ] Add personalized explanations and learning paths.
- [ ] Add adaptive difficulty and question selection.
- [ ] Add reassessment and observed progress comparison.

### Phase 3 — Teacher insights
- [ ] Add class and student seed scenarios.
- [ ] Implement class mastery aggregates.
- [ ] Build heatmap and common misconception views.
- [ ] Add transparent support signals and authorization tests.

### Phase 4 — AI enhancement
- [ ] Add validated server-side misconception analysis.
- [ ] Add constrained question/explanation generation.
- [ ] Test timeouts, invalid JSON, rate limits, and provider outages.
- [ ] Confirm deterministic fallback preserves the core demo.

### Phase 5 — Demo readiness
- [ ] Run all tests and production build.
- [ ] Verify setup instructions from a clean environment.
- [ ] Prepare a repeatable 3–5 minute demo scenario.
- [ ] Label seeded data and model estimates clearly.
- [ ] Check privacy, responsiveness, accessibility, and failure states.
- [ ] Record known limitations and future work honestly.

---

## 14. Demo scenario

Use a repeatable scenario, not improvised live data:

1. A seeded student begins a quadratic-equations quiz.
2. The student submits a response that matches a known factorization error pattern.
3. The system displays the likely misconception and the evidence supporting it, with uncertainty language.
4. The graph highlights factorization as a prerequisite that needs practice.
5. BKT updates the mastery estimate from the recorded response.
6. The student receives a worked example and a simpler factorization question.
7. After practice, the student answers a comparable reassessment question.
8. The student progress page shows observed scores, attempts, and updated estimated mastery.
9. The teacher dashboard shows the updated student status and aggregated class pattern.

**Demo integrity:** If seeded or scripted responses are used, label them as demo data. Do not claim the result proves real-world educational effectiveness.

---

## 15. Decisions log

Record important decisions here so agents do not make conflicting assumptions.

| Decision | Current default | Status |
|---|---|---|
| First subject | School-level algebra | Proposed |
| Initial concept chain | Basic Algebra → Factorization → Quadratic Equations | Proposed |
| Mastery model | BKT first; DKT deferred | Proposed |
| Misconception detection | Deterministic rules + optional AI | Proposed |
| AI availability | Optional, with curated fallback | Required design principle |
| Data source | Curated questions and explicitly labelled demo seeds | Proposed |
| Stack | Inspect existing repository before deciding | Pending discovery |
| Authentication | Role-based access required for teacher data; implementation choice pending | Pending |
| Deployment target | Decide after local vertical slice works | Pending |

---

## 16. Agent completion report template

Every agent should append or send a report in this format:

```text
Task:
Status: Complete / Partial / Blocked

Summary:
- ...

Files changed:
- ...

Tests/commands run:
- ...

Results:
- ...

Known limitations:
- ...

Follow-up needed:
- ...
```

---

## 17. Final success criteria

The MVP is ready to present when a judge can observe, end to end, that:

- The system tracks concept relationships and estimated mastery.
- A student's wrong answer triggers evidence-based, uncertainty-aware feedback.
- The next activity is selected based on the student's learning state.
- Mastery updates through a documented BKT calculation.
- Reassessment records actual performance and shows a defensible comparison.
- A teacher sees useful class-level patterns and support signals.
- The experience remains usable if the AI provider is unavailable.
- The team can explain what is rule-based, what is AI-generated, what is estimated, and what has actually been measured.


---

## 18. Reliability fixes and high-priority additions

This section strengthens the original seven features and is mandatory for all implementation agents. These are not optional polish items: they address risks in the product's core learning claims.

### 18.1 Evidence-aware misconception detection

**Problem addressed:** A single incorrect answer does not prove that a student misunderstands a concept.

- [ ] Use a controlled taxonomy: `prerequisite_gap`, `concept_misunderstanding`, `formula_confusion`, `arithmetic_or_sign_error`, `question_misread`, `possible_typo`, and `insufficient_evidence`.
- [ ] Store question-specific expected reasoning, concept tags, and known misconception patterns.
- [ ] Prefer deterministic checks for known patterns; use AI as supporting analysis for free-text working steps.
- [ ] Record evidence, confidence, detection source, and alternative explanations.
- [ ] Return `insufficient_evidence` when the evidence is weak or ambiguous.
- [ ] Ask a short diagnostic follow-up when two or more explanations remain plausible.
- [ ] Do not permanently assign a misconception to a student; observations must be tied to attempts and allowed to change with new evidence.

**Acceptance criteria**
- One wrong answer alone does not automatically establish a misconception.
- Detection can abstain rather than guess.
- A diagnostic follow-up is selected to distinguish between plausible explanations.
- UI language uses “may indicate”, “possible”, and “based on these attempts” where appropriate.
- Tests cover ambiguity, lucky guesses, typos, blank answers, and conflicting evidence.

### 18.2 Student confidence signal

- [ ] Add an optional confidence choice such as `low`, `medium`, or `high` after answering.
- [ ] Store confidence with the attempt, separate from correctness and BKT state.
- [ ] Use confidence only as supplementary evidence for feedback and diagnostic follow-ups.
- [ ] Never treat self-reported confidence as proof of knowledge or use it alone to lower mastery.

**Acceptance criteria**
- Confidence is optional and does not block quiz completion.
- Confidence never directly changes BKT mastery.
- UI explains that confidence helps tailor support, not grade the student.

### 18.3 BKT safeguards and mastery calibration

**Problem addressed:** Estimated mastery can look more precise than the data supports.

- [ ] Implement BKT in a standalone, unit-tested module.
- [ ] Document the exact update equation and parameters: prior knowledge (`P(L0)`), learning (`P(T)`), guessing (`P(G)`), and slipping (`P(S)`).
- [ ] Keep mastery estimation separate from observed correctness/accuracy.
- [ ] Store attempt count, last assessed time, and the version of the BKT parameters used.
- [ ] Show “limited evidence” when there are too few relevant attempts.
- [ ] Evaluate estimates using fresh, comparable questions not used for the preceding practice cycle.
- [ ] Prevent repeated exposure to the same item from being presented as independent evidence of mastery.
- [ ] Do not silently change parameters after deployment; version model parameters and document changes.
- [ ] Avoid presenting excessive decimal precision; show a percentage or level plus evidence context.

**Acceptance criteria**
- Unit tests verify correct and incorrect updates, boundary values, and repeated attempts.
- UI shows estimated mastery and observed performance as different metrics.
- The system does not label mastery “confirmed” from a tiny sample.
- Parameters are described as prototype defaults unless calibrated on suitable data.

### 18.4 Question and explanation quality gate

**Problem addressed:** AI-generated learning material may be incorrect, ambiguous, duplicated, or mismatched to a student's level.

- [ ] Use curated questions as the default source for the MVP.
- [ ] If AI generation is enabled, constrain it to a concept, difficulty, question format, and structured schema.
- [ ] Validate required fields, answer format, concept IDs, difficulty range, and content length server-side.
- [ ] Check answer consistency using deterministic validation where possible; for math questions, use known answers or supported symbolic/numeric checks when feasible.
- [ ] Reject or quarantine invalid, ambiguous, or unsupported generated content.
- [ ] Store source (`curated` or `generated`), generation metadata, and validation status.
- [ ] Provide a report/flag action for students and review/approve/disable actions for authorized teachers.
- [ ] Keep a deterministic curated fallback for provider outages and invalid output.
- [ ] Do not display generated content as teacher-approved unless it was actually reviewed.

**Acceptance criteria**
- Invalid generated content never enters the active question pool without passing validation.
- Provider failure does not prevent a student from completing the core learning cycle.
- Content origin and review status are visible to authorized users.
- Tests cover malformed output, wrong answer keys, duplicate content, and timeouts.

### 18.5 Knowledge graph must drive learning decisions

- [ ] Represent prerequisite edges in stored data, not only in the graph UI.
- [ ] Define and test graph traversal for prerequisite discovery and learning-path ordering.
- [ ] Detect cycles during seed/import validation and reject or report invalid prerequisite loops.
- [ ] When prerequisites have low or uncertain mastery, recommend a relevant diagnostic or practice activity before advancing.
- [ ] Show why a prerequisite was recommended.
- [ ] Keep graph visualization and backend learning logic on the same concept data source.

**Acceptance criteria**
- Changing a prerequisite relationship changes the recommended path without editing UI code.
- Cyclic relationships are detected.
- Every graph recommendation has a traceable reason and linked concept/activity.

### 18.6 Fair teacher support signals

**Problem addressed:** An “at-risk” label based on a few answers can be misleading or stigmatizing.

- [ ] Call the feature “Needs support” or “Support signal”, not a diagnosis or permanent risk label.
- [ ] Define transparent, configurable initial rules using multiple pieces of evidence, such as repeated recent errors, low estimated mastery, and sufficient attempt count.
- [ ] Include evidence and recency for every signal.
- [ ] Provide a low-evidence/insufficient-data state rather than forcing every student into a category.
- [ ] Allow teachers to inspect relevant attempts and mark a signal as reviewed; do not let a manual review erase the original evidence.
- [ ] Do not infer sensitive personal attributes or use protected traits for recommendations.
- [ ] Do not rank students publicly or create permanent labels.

**Acceptance criteria**
- A teacher can understand why a support signal appeared.
- Students with insufficient evidence are not automatically labelled.
- All class/student endpoints enforce teacher-class authorization on the server.

### 18.7 Reassessment validity and progress claims

**Problem addressed:** Repeating the same question may measure memory of the answer rather than learning.

- [ ] Create comparable reassessment items that test the same concept with different surface details or values.
- [ ] Record pre-instruction and post-instruction attempts separately.
- [ ] Report observed correctness/score, attempt counts, and estimated mastery separately.
- [ ] State when samples are too small or questions are not comparable.
- [ ] Do not claim that the intervention caused improvement from a simple before/after comparison alone.
- [ ] If an appropriate question bank is not available, label the comparison as a preliminary practice check.
- [ ] Ensure the student can inspect their learning history and recommended next step.

**Acceptance criteria**
- Progress comparisons use actual persisted attempts.
- Reassessment normally uses a fresh item, not the identical question.
- No fabricated improvement or causal effectiveness claim appears in the UI or demo.

---

## 19. Additional high-priority user stories

### Diagnostic follow-up questions
- [ ] Add a diagnostic-question type to the question model or activity schema.
- [ ] Associate each diagnostic question with the competing misconceptions it helps distinguish.
- [ ] Select the follow-up based on uncertainty in the current observation.
- [ ] Update the misconception observation after the follow-up; keep the original attempt record immutable.
- [ ] Test that follow-up questions distinguish plausible error categories and do not loop indefinitely.

### Explainable recommendations
- [ ] Every recommended question, lesson, or prerequisite includes a machine-readable reason code and a student-friendly explanation.
- [ ] Reason codes may include `prerequisite_mastery_low`, `recent_error_pattern`, `mastery_uncertain`, `ready_for_harder_question`, and `spaced_review_due`.
- [ ] The backend returns the reason; the frontend must not invent explanations that contradict the selection logic.
- [ ] Add tests mapping each reason code to a valid recommendation.

### Automated evaluation suite
- [ ] Create a version-controlled fixture set of representative student answers with expected correctness and likely error categories.
- [ ] Include ambiguous answers where the expected outcome is `insufficient_evidence`.
- [ ] Measure per-category precision/recall where the fixture size supports meaningful interpretation; report sample size and avoid overstating results.
- [ ] Test generated-question schema validity, answer consistency, duplication, and fallback behavior.
- [ ] Keep evaluation separate from the product's demo dataset.
- [ ] Run the suite before changing prompts, rules, BKT parameters, or question-selection logic.
- [ ] Record known limitations and false-positive cases.

### Teacher content review
- [ ] Add content states such as `draft`, `pending_review`, `approved`, `rejected`, and `disabled` where generated content is used.
- [ ] Restrict review actions to authorized teachers/admins.
- [ ] Record reviewer, review timestamp, and reason for rejection/disable where applicable.
- [ ] Never allow unreviewed generated content to be represented as approved.
- [ ] Keep curated seed questions usable even when review features are unavailable.

---

## 20. Updated data and API requirements

These additions extend the model proposal in Section 6; adapt to the actual repository and avoid unnecessary duplication.

### Additional fields/entities to consider
- **Attempt:** optional confidence level, response duration if appropriate, item version, and session identifier.
- **MisconceptionObservation:** category, evidence, confidence, alternative hypotheses or `needsMoreEvidence`, source, detector version, and status.
- **Question:** source, validation status, review status, content version, and optional `createdBy`/`reviewedBy`.
- **Recommendation:** student/session, target concept/activity, reason code, human-readable reason, and creation time; can be derived rather than persisted if reproducible.
- **ModelConfigurationVersion:** BKT parameter version and effective date; can be simple configuration metadata for the MVP.
- **ContentReview:** question/explanation reference, reviewer, decision, notes, and timestamp if review history is needed.

### Additional API responsibilities
- [ ] Add a route or response field for diagnostic follow-up when evidence is insufficient.
- [ ] Return recommendation reason codes with next activities.
- [ ] Add authorized teacher endpoints for reviewing/flagging generated content if generation is enabled.
- [ ] Add a student endpoint to report questionable content.
- [ ] Keep mastery updates server-side and ensure duplicate submissions do not apply the same BKT update twice.
- [ ] Use idempotency or attempt IDs to prevent accidental duplicate submissions from double-counting.
- [ ] Ensure the attempt response does not reveal correct answers before submission.

---

## 21. Updated acceptance tests

Add these to the existing testing section.

- [ ] One incorrect answer with ambiguous evidence returns `insufficient_evidence` or a diagnostic follow-up, not a confident diagnosis.
- [ ] A known, well-defined error pattern is detected with supporting evidence.
- [ ] A confidence choice does not directly alter mastery.
- [ ] BKT updates once per unique attempt and not twice after a retry.
- [ ] The graph's prerequisite edges influence the next recommended activity.
- [ ] A cycle in the prerequisite graph is detected during validation.
- [ ] A generated question with an incorrect or missing answer key is rejected or quarantined.
- [ ] AI timeout/invalid output falls back to curated content.
- [ ] Teacher support signals include evidence and handle insufficient data.
- [ ] A teacher from one class cannot access another class's students or review actions.
- [ ] Reassessment uses a fresh comparable item where available and shows sample-size limitations.
- [ ] Recommendation reason codes match the actual selection logic.
- [ ] Evaluation fixtures include false-positive and insufficient-evidence cases.

---

## 22. Updated multi-agent ownership

These assignments supplement Section 12.

### Agent 1 — Backend/data
- [ ] Enforce idempotent attempt submission so retries do not double-count mastery.
- [ ] Add item/content version and provenance fields where needed.
- [ ] Enforce content-review permissions and teacher/class isolation.
- [ ] Store immutable attempt records and link observations to evidence.

### Agent 2 — Learning engine
- [ ] Implement uncertainty-aware misconception outcomes and diagnostic follow-up selection.
- [ ] Keep confidence separate from BKT inputs.
- [ ] Add graph-cycle detection and prerequisite-driven recommendations.
- [ ] Add recommendation reason codes and BKT configuration versioning.
- [ ] Build the evaluation fixtures and regression tests for learning logic.

### Agent 3 — Student UI
- [ ] Add optional confidence input.
- [ ] Display uncertainty-aware misconception feedback and diagnostic follow-up.
- [ ] Show why a lesson or question is recommended.
- [ ] Display observed accuracy separately from estimated mastery.
- [ ] Add a report-question/explanation action and accessible progress states.

### Agent 4 — Teacher dashboard
- [ ] Use “support signal” language with transparent evidence, recency, and sample size.
- [ ] Add generated-content review actions if AI-generated content is enabled.
- [ ] Display content provenance/review status and class aggregates from authorized APIs.

### Agent 5 — AI integration/QA
- [ ] Validate structured AI output and question answer consistency.
- [ ] Implement timeouts, provider failure handling, curated fallback, and content quarantine.
- [ ] Maintain misconception/question evaluation fixtures and run regression tests.
- [ ] Test ambiguous evidence, false positives, repeated submissions, and invalid generated content.

### Coordinator
- [ ] Confirm these changes do not create overlapping ownership or incompatible interfaces.
- [ ] Ensure shared contracts include uncertainty, evidence, reason codes, provenance, and model version where needed.
- [ ] Review demo claims for accuracy and make sure seeded data is labelled.
- [ ] Ensure every critical path works without the AI provider.

---

## 23. Revised MVP release gate

Do not call the MVP demo-ready until all of the following are true:

- [ ] The end-to-end student learning cycle works from persisted data.
- [ ] Misconception detection can abstain and can ask a diagnostic follow-up.
- [ ] BKT is unit-tested, versioned, and separated from observed accuracy.
- [ ] Prerequisite graph data changes actual learning recommendations.
- [ ] Every recommendation has an explainable reason.
- [ ] Generated content is validated and has a safe fallback.
- [ ] Reassessment uses fresh comparable questions when available and avoids unsupported claims.
- [ ] Teacher support signals are evidence-based and do not overstate certainty.
- [ ] Role-based access and class-level data isolation pass tests.
- [ ] Evaluation fixtures cover known cases, ambiguous cases, and failure cases.
- [ ] The full demo remains functional when the AI provider is offline.

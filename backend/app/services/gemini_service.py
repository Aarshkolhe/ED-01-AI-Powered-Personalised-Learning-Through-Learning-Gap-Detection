"""
Google Gemini AI Provider Service for ThinkFlow.
Provides real AI tutor conversations, dynamic lesson generation,
dynamic assessment authoring, and generalized misconception detection
using the official Google GenAI SDK (from google import genai).
"""

import os
import json
import time
import logging
from typing import Optional, Dict, Any, List, Tuple

from app.core.config import settings
from app.models.schemas import (
    TutorChatMessage, TutorChatResponse,
    DynamicLesson, DynamicLessonRequest,
    StudentQuestion, StudentQuestionOption, Question, QuestionOption,
    ContentReviewStatus, ValidationStatus, ErrorTaxonomyCategory
)

logger = logging.getLogger("thinkflow.gemini")


class GeminiService:
    def __init__(self):
        self.timeout = float(getattr(settings, "GEMINI_TIMEOUT_SECONDS", 15.0))
        self.max_tokens = int(getattr(settings, "GEMINI_MAX_TOKENS", 1500))
        self.max_retries = int(getattr(settings, "GEMINI_MAX_RETRIES", 2))
        self._cached_client = None
        self._cached_key = None

    @property
    def api_key(self) -> Optional[str]:
        k = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        if k and k.strip() and not k.strip().startswith("your-"):
            return k.strip()
        return None

    @property
    def model(self) -> str:
        return getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    def is_configured(self) -> bool:
        return self.api_key is not None

    def _get_client(self):
        """Returns initialized google.genai Client."""
        if not self.is_configured():
            return None
        current_key = self.api_key
        if self._cached_client is None or self._cached_key != current_key:
            from google import genai
            self._cached_client = genai.Client(api_key=current_key)
            self._cached_key = current_key
        return self._cached_client

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------
    def check_health(self) -> Dict[str, Any]:
        """Provider health endpoint without returning secrets."""
        if not self.is_configured():
            return {
                "status": "missing_key",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": False,
                "is_fallback": True,
                "message": "GEMINI_API_KEY not configured. Set your Google Gemini API key in .env"
            }

        client = self._get_client()
        if not client:
            return {
                "status": "missing_key",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": False,
                "is_fallback": True,
                "message": "GEMINI_API_KEY not configured. Set your Google Gemini API key in .env"
            }

        try:
            from google.genai import types
            config = types.GenerateContentConfig(max_output_tokens=5)
            res = client.models.generate_content(
                model=self.model,
                contents="ping",
                config=config
            )
            return {
                "status": "ready",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": True,
                "is_fallback": False,
                "message": "Google Gemini API connected and verified operational."
            }
        except Exception as e:
            err_text = str(e)
            err_lower = err_text.lower()
            logger.warning(f"Gemini health check error: {type(e).__name__} - {err_text}")

            if "401" in err_text or "api_key_invalid" in err_lower or "api key not valid" in err_lower:
                return {
                    "status": "invalid_key",
                    "provider": "Google Gemini",
                    "model": self.model,
                    "is_configured": True,
                    "is_fallback": True,
                    "message": "Provided GEMINI_API_KEY was rejected. Check your key at https://aistudio.google.com/apikey"
                }
            if "403" in err_text or "permission_denied" in err_lower:
                return {
                    "status": "permission_denied",
                    "provider": "Google Gemini",
                    "model": self.model,
                    "is_configured": True,
                    "is_fallback": True,
                    "message": "Gemini API access denied (403). Check project access at https://aistudio.google.com/"
                }
            if "404" in err_text or "not_found" in err_lower:
                return {
                    "status": "unsupported_model",
                    "provider": "Google Gemini",
                    "model": self.model,
                    "is_configured": True,
                    "is_fallback": True,
                    "message": f"Gemini model '{self.model}' is unavailable or not found. Check GEMINI_MODEL in .env"
                }
            if "429" in err_text or "resource_exhausted" in err_lower or "quota" in err_lower:
                if "quota" in err_lower or "billing" in err_lower:
                    return {
                        "status": "out_of_credits",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": True,
                        "message": "Gemini API quota exceeded or billing not enabled. Visit https://aistudio.google.com/"
                    }
                return {
                    "status": "rate_limited",
                    "provider": "Google Gemini",
                    "model": self.model,
                    "is_configured": True,
                    "is_fallback": True,
                    "message": "Gemini rate limit reached (429). Please try again shortly."
                }
            return {
                "status": "error",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": True,
                "is_fallback": True,
                "message": f"Gemini error: {err_text[:120]}"
            }

    # ------------------------------------------------------------------
    # 1. AI TUTOR CONVERSATION
    # ------------------------------------------------------------------
    def chat_tutor(
        self,
        messages: List[TutorChatMessage],
        subject: str,
        topic: str,
        level: str = "intermediate",
        action: Optional[str] = None
    ) -> TutorChatResponse:
        """
        Conducts an interactive, multi-turn tutoring session across any subject/topic using Google Gemini.
        Preserves dialogue history and supports quick pedagogical modifiers.
        """
        if not self.is_configured():
            return TutorChatResponse(
                response="",
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=[],
                is_fallback=False,
                model=self.model,
                error="GEMINI_API_KEY is not configured in backend environment.",
                error_code="missing_key"
            )

        client = self._get_client()
        if not client:
            return TutorChatResponse(
                response="",
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=[],
                is_fallback=False,
                model=self.model,
                error="Google Gemini client could not be initialized.",
                error_code="client_error"
            )

        system_prompt = (
            f"You are ThinkFlow AI, an expert, supportive, and pedagogical AI tutor in {subject}.\n"
            f"Current Topic: '{topic}' | Target Level: {level.capitalize()}.\n"
            "Pedagogical Guidelines:\n"
            "- Explain concepts clearly, encouraging curiosity and building deep understanding.\n"
            "- Use LaTeX equations (inline with $...$ or display with $$...$$) for mathematical and scientific expressions.\n"
            "- Use clean Markdown code blocks with syntax highlighting for programming topics.\n"
            "- If the student is confused, break down the concept into fundamental principles step by step.\n"
            "- At the end of your response, ALWAYS include exactly 3 suggested follow-up questions formatted as:\n"
            "FOLLOW_UP_SUGGESTIONS:\n"
            "1. <question 1>\n"
            "2. <question 2>\n"
            "3. <question 3>"
        )

        modifier_instruction = ""
        if action == "simplify":
            modifier_instruction = "\nInstruction: Provide an extra simple, intuitive explanation suitable for a beginner."
        elif action == "analogy":
            modifier_instruction = "\nInstruction: Explain this concept using a vivid, memorable real-world analogy."
        elif action == "worked_example":
            modifier_instruction = "\nInstruction: Provide a comprehensive, step-by-step worked example with each step justified."
        elif action == "practice_question":
            modifier_instruction = "\nInstruction: Formulate 1 targeted practice problem for the student to solve right now."
        elif action == "summary":
            modifier_instruction = "\nInstruction: Provide a bulleted summary of key principles and takeaways."

        full_system_instruction = system_prompt + modifier_instruction

        from google.genai import types

        contents = []
        for m in messages:
            role = m.role if m.role in ("user", "assistant") else "user"
            gemini_role = "model" if role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=m.content)]
                )
            )

        if not contents:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=f"Please introduce {topic} in {subject}.")]))

        config = types.GenerateContentConfig(
            system_instruction=full_system_instruction,
            temperature=0.3,
            max_output_tokens=self.max_tokens
        )

        try:
            res = client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )
            raw_text = res.text or ""
            clean_resp, followups = self._extract_followups(raw_text)
            return TutorChatResponse(
                response=clean_resp,
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=followups,
                is_fallback=False,
                model=self.model
            )
        except Exception as e:
            err_text = str(e)
            err_lower = err_text.lower()
            logger.warning(f"Gemini chat error: {type(e).__name__} - {err_text}")

            err_code = "api_error"
            user_msg = f"Google Gemini API error: {err_text[:160]}"

            if "401" in err_text or "api_key_invalid" in err_lower or "api key not valid" in err_lower:
                err_code = "invalid_key"
                user_msg = "Invalid Google Gemini API Key. Please verify your API key at https://aistudio.google.com/apikey"
            elif "404" in err_text or "not_found" in err_lower:
                err_code = "unsupported_model"
                user_msg = f"Gemini model '{self.model}' is not supported or not found. Please set GEMINI_MODEL in .env to a supported model (e.g. gemini-3.5-flash)."
            elif "403" in err_text or "permission_denied" in err_lower:
                err_code = "permission_denied"
                user_msg = "Access denied by Google Gemini API. Please check your project access at https://aistudio.google.com/"
            elif "429" in err_text or "resource_exhausted" in err_lower or "quota" in err_lower:
                if "quota" in err_lower or "billing" in err_lower:
                    err_code = "out_of_credits"
                    user_msg = "Google Gemini API quota exceeded or billing not enabled. Visit https://aistudio.google.com/ to manage your quota."
                else:
                    err_code = "rate_limited"
                    user_msg = "Google Gemini rate limit reached. Please wait a moment and try again."
            elif "safety" in err_lower:
                err_code = "safety_blocked"
                user_msg = "The response was blocked by Google Gemini safety filters. Please rephrase your question."
            elif "timeout" in err_lower:
                err_code = "timeout"
                user_msg = "Google Gemini API request timed out. Please try again."

            return TutorChatResponse(
                response="",
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=[],
                is_fallback=False,
                model=self.model,
                error=user_msg,
                error_code=err_code
            )

    def _extract_followups(self, text: str) -> Tuple[str, List[str]]:
        marker = "FOLLOW_UP_SUGGESTIONS:"
        if marker in text:
            parts = text.split(marker)
            body = parts[0].strip()
            raw_sugg = parts[1].strip().split("\n")
            followups = [
                s.lstrip("0123456789.- *").strip()
                for s in raw_sugg if s.strip()
            ][:3]
            return body, followups
        return text, [
            "Can you give me a worked example of this?",
            "What is a real-world application of this concept?",
            "Can we do a practice problem together?"
        ]

    # ------------------------------------------------------------------
    # 2. DYNAMIC LESSON GENERATION
    # ------------------------------------------------------------------
    def generate_lesson(
        self,
        subject: str,
        topic: str,
        level: str = "intermediate",
        learning_objective: Optional[str] = None,
        style: Optional[str] = "concept_first",
        difficulty_areas: Optional[List[str]] = None,
        student_id: Optional[str] = "student_alex"
    ) -> DynamicLesson:
        """Generates a comprehensive, pedagogical lesson using Google Gemini."""
        obj_text = learning_objective or f"Master foundational and applied concepts of {topic}"

        if not self.is_configured():
            return self._fallback_lesson(subject, topic, level, obj_text, student_id)

        client = self._get_client()
        if not client:
            return self._fallback_lesson(subject, topic, level, obj_text, student_id)

        system_instruction = (
            "You are a master curriculum designer and author for ThinkFlow. "
            "Generate a structured, high-impact lesson in valid JSON matching the exact schema below.\n"
            "JSON SCHEMA:\n"
            "{\n"
            '  "learning_objectives": ["obj1", "obj2"],\n'
            '  "prerequisites": ["prereq1", "prereq2"],\n'
            '  "core_explanation": "Markdown text with LaTeX and clear conceptual explanations.",\n'
            '  "step_by_step_examples": [\n'
            '    {"title": "Example 1", "steps": ["step 1", "step 2"], "takeaway": "key insight"}\n'
            "  ],\n"
            '  "common_mistakes_and_misconceptions": [\n'
            '    {"mistake": "Description", "why_it_happens": "Reason", "how_to_fix": "Fix"}\n'
            "  ],\n"
            '  "practice_questions": [\n'
            '    {"prompt": "Question text", "hint": "Clue", "solution": "Full solution"}\n'
            "  ],\n"
            '  "short_summary": "Concise summary",\n'
            '  "suggested_next_steps": ["step 1", "step 2"]\n'
            "}"
        )
        user_prompt = (
            f"Subject: {subject}\n"
            f"Topic: {topic}\n"
            f"Level: {level}\n"
            f"Learning Objective: {obj_text}\n"
            f"Pedagogical Style: {style}\n"
            f"Areas of Difficulty: {', '.join(difficulty_areas) if difficulty_areas else 'None noted'}"
        )

        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=self.max_tokens
            )
            res = client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=config
            )
            raw = (res.text or "").strip()
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            lesson_id = f"lesson_{subject.lower()[:3]}_{topic.lower().replace(' ', '_')[:16]}_{int(time.time())}"
            return DynamicLesson(
                id=lesson_id,
                student_id=student_id,
                subject=subject,
                topic=topic,
                level=level,
                learning_objectives=data.get("learning_objectives", [obj_text]),
                prerequisites=data.get("prerequisites", [f"Basic {subject} fundamentals"]),
                core_explanation=data.get("core_explanation", f"In-depth analysis of {topic}."),
                step_by_step_examples=data.get("step_by_step_examples", []),
                common_mistakes_and_misconceptions=data.get("common_mistakes_and_misconceptions", []),
                practice_questions=data.get("practice_questions", []),
                short_summary=data.get("short_summary", f"Key principles of {topic} reviewed."),
                suggested_next_steps=data.get("suggested_next_steps", ["Attempt the diagnostic assessment"]),
                review_status=ContentReviewStatus.APPROVED,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                is_fallback=False
            )
        except Exception as e:
            logger.warning(f"Error generating Gemini lesson: {e}. Using deterministic curriculum structure.")
            return self._fallback_lesson(subject, topic, level, obj_text, student_id)

    # ------------------------------------------------------------------
    # 3. DYNAMIC ASSESSMENT GENERATION
    # ------------------------------------------------------------------
    def generate_assessment_questions(
        self,
        subject: str,
        topic: str,
        difficulty: float = 0.5,
        question_count: int = 3,
        question_type: str = "multiple_choice"
    ) -> List[Question]:
        """Generates validated assessment questions using Google Gemini."""
        if not self.is_configured():
            return self._fallback_questions(subject, topic, difficulty, question_count)

        client = self._get_client()
        if not client:
            return self._fallback_questions(subject, topic, difficulty, question_count)

        system_instruction = (
            "You are a rigorous educational psychometrics item writer for ThinkFlow. "
            "Output ONLY valid JSON containing a list of multiple choice questions matching this schema:\n"
            "[\n"
            "  {\n"
            '    "id": "q_unique_id",\n'
            '    "prompt": "Clear, unambiguous question prompt",\n'
            '    "options": [\n'
            '      {"id": "o1", "text": "Correct Option", "misconception_id": null},\n'
            '      {"id": "o2", "text": "Plausible Distractor", "misconception_id": "misconception_code", "misconception_explanation": "Why this distractor is chosen"},\n'
            '      {"id": "o3", "text": "Another Distractor", "misconception_id": null},\n'
            '      {"id": "o4", "text": "Third Distractor", "misconception_id": null}\n'
            "    ],\n"
            '    "correct_answer": "Exact text of Correct Option",\n'
            '    "worked_solution": ["Step 1", "Step 2", "Conclusion"]\n'
            "  }\n"
            "]"
        )
        user_prompt = (
            f"Generate {question_count} high-quality diagnostic multiple-choice questions for '{topic}' "
            f"in {subject} at difficulty level {difficulty} (0.0 to 1.0). "
            "Include plausible distractors that diagnose common conceptual mistakes."
        )

        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=self.max_tokens
            )
            res = client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=config
            )
            raw = (res.text or "").strip()
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            if isinstance(data, list) and len(data) > 0:
                verified_questions = []
                for i, item in enumerate(data):
                    correct = str(item.get("correct_answer", "")).strip()
                    opts = item.get("options", [])
                    opt_texts = [str(o.get("text", "")).strip().lower() for o in opts]
                    if correct and len(opts) >= 2 and correct.lower() in opt_texts:
                        q_id = item.get("id") or f"dyn_{topic.lower().replace(' ', '_')[:10]}_{int(time.time())}_{i}"
                        verified_questions.append(Question(
                            id=q_id,
                            concept_id=f"topic_{topic.lower().replace(' ', '_')}",
                            prompt=item["prompt"],
                            question_type="multiple_choice",
                            options=[
                                QuestionOption(
                                    id=o.get("id", f"opt_{j}"),
                                    text=o["text"],
                                    misconception_id=o.get("misconception_id"),
                                    misconception_explanation=o.get("misconception_explanation")
                                ) for j, o in enumerate(opts)
                            ],
                            correct_answer=correct,
                            worked_solution=item.get("worked_solution", ["Evaluate rules step by step."]),
                            difficulty=difficulty,
                            source="generated",
                            review_status=ContentReviewStatus.APPROVED,
                            validation_status=ValidationStatus.VALID
                        ))
                if len(verified_questions) >= 1:
                    return verified_questions[:question_count]
        except Exception as e:
            logger.warning(f"Error generating Gemini questions: {e}. Using deterministic curriculum questions.")

        return self._fallback_questions(subject, topic, difficulty, question_count)

    # ------------------------------------------------------------------
    # 4. GENERALIZED MISCONCEPTION DETECTION
    # ------------------------------------------------------------------
    def analyze_misconception_generalized(
        self,
        problem: str,
        student_answer: str,
        correct_answer: str,
        reasoning: Optional[str] = None,
        subject: str = "Mathematics",
        concept_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyzes student response against the controlled error taxonomy using Google Gemini."""
        clean_stud = (student_answer or "").strip()
        clean_corr = (correct_answer or "").strip()

        # Rule 1: Blank or identical answer
        if not clean_stud or clean_stud.lower() == clean_corr.lower():
            return {
                "category": ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE,
                "misconception_id": None,
                "confidence": 1.0,
                "evidence": "Correct response or blank entry; no misconception diagnosed.",
                "remediation_hint": "Well done! Your solution matches the expected answer." if clean_stud.lower() == clean_corr.lower() else "Please attempt the problem before submitting."
            }

        # Rule 2: Near-miss typo check
        if len(clean_stud) >= 2 and len(clean_corr) >= 2:
            is_typo = False
            diff_count = sum(1 for a, b in zip(clean_stud, clean_corr) if a != b) + abs(len(clean_stud) - len(clean_corr))
            if diff_count == 1 and not clean_stud.isdigit():
                is_typo = True
            if is_typo:
                return {
                    "category": ErrorTaxonomyCategory.TRANSCRIPTION_TYPO,
                    "misconception_id": None,
                    "confidence": 0.85,
                    "evidence": f"Input '{clean_stud}' deviates from expected '{clean_corr}' by only a single transposed/omitted character.",
                    "remediation_hint": "Check for typos or misplaced symbols."
                }

        if not self.is_configured():
            return self._fallback_misconception_analysis(problem, clean_stud, clean_corr, subject)

        client = self._get_client()
        if not client:
            return self._fallback_misconception_analysis(problem, clean_stud, clean_corr, subject)

        system_instruction = (
            "You are a rigorous diagnostic psychometrics evaluator in STEM pedagogy for ThinkFlow.\n"
            "Analyze student mistakes against this controlled error taxonomy:\n"
            "- concept_misunderstanding\n"
            "- formula_confusion\n"
            "- step_execution_breakdown\n"
            "- arithmetic_or_sign_error\n"
            "- transcription_typo\n"
            "- insufficient_evidence\n\n"
            "Output JSON with keys: category, misconception_id, confidence, evidence, remediation_hint."
        )
        user_prompt = (
            f"Subject: {subject}\n"
            f"Problem: {problem}\n"
            f"Expected Answer: {clean_corr}\n"
            f"Student Answer: {clean_stud}\n"
            f"Student Reasoning: {reasoning or 'None supplied'}\n"
        )

        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=600
            )
            res = client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=config
            )
            raw = (res.text or "").strip()
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)

            conf = float(data.get("confidence", 0.5))
            if conf < 0.60:
                return {
                    "category": ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE,
                    "misconception_id": None,
                    "confidence": conf,
                    "evidence": f"Low diagnostic certainty ({conf:.2f}); abstaining from diagnosing misconception.",
                    "remediation_hint": "Review the problem statement and verify each step."
                }

            valid_categories = {c.value: c for c in ErrorTaxonomyCategory}
            cat_str = str(data.get("category", "")).lower()
            final_cat = valid_categories.get(cat_str, ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING)

            return {
                "category": final_cat,
                "misconception_id": data.get("misconception_id"),
                "confidence": conf,
                "evidence": data.get("evidence", "Identified based on answer discrepancy pattern."),
                "remediation_hint": data.get("remediation_hint", "Review the governing rules for this operation.")
            }
        except Exception as e:
            logger.warning(f"Error parsing Gemini misconception evaluation: {e}")

        return self._fallback_misconception_analysis(problem, clean_stud, clean_corr, subject)

    # ------------------------------------------------------------------
    # Deterministic Local Fallbacks (Used only if offline / no API key)
    # ------------------------------------------------------------------
    def _fallback_lesson(self, subject: str, topic: str, level: str, obj_text: str, student_id: Optional[str]) -> DynamicLesson:
        lesson_id = f"lesson_{subject.lower()[:3]}_{topic.lower().replace(' ', '_')[:16]}_{int(time.time())}"
        return DynamicLesson(
            id=lesson_id,
            student_id=student_id or "student_alex",
            subject=subject,
            topic=topic,
            level=level,
            learning_objectives=[obj_text, f"Identify and eliminate misconceptions in {topic}"],
            prerequisites=[f"Basic arithmetic & {subject} foundational knowledge"],
            core_explanation=(
                f"### Understanding {topic}\n\n"
                f"When working with **{topic}** in {subject}, the key principle is establishing consistent conceptual foundations. "
                f"Break the problem down step by step and verify each operation before proceeding."
            ),
            step_by_step_examples=[
                {
                    "title": f"Standard Application of {topic}",
                    "steps": [
                        "Step 1: Read the problem carefully and identify the given variables.",
                        "Step 2: Apply the governing formula or rule directly.",
                        "Step 3: Simplify and verify units or boundary conditions."
                    ],
                    "takeaway": "Always verify intermediate steps before concluding."
                }
            ],
            common_mistakes_and_misconceptions=[
                {
                    "mistake": "Rushing through intermediate operations without checking signs/units",
                    "why_it_happens": "Focusing solely on the final answer rather than rigorous step derivation.",
                    "how_to_fix": "Write out each algebraic or arithmetic transformation explicitly."
                }
            ],
            practice_questions=[
                {
                    "prompt": f"Apply the foundational rule of {topic} to a basic test case.",
                    "hint": "Refer to the step-by-step example above.",
                    "solution": "Follow each step methodically to reach the verified solution."
                }
            ],
            short_summary=f"Core principles of {topic} reviewed with step-by-step guidance.",
            suggested_next_steps=["Take the diagnostic assessment", "Review related prerequisite topics"],
            review_status=ContentReviewStatus.APPROVED,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            is_fallback=True
        )

    def _fallback_questions(self, subject: str, topic: str, difficulty: float, question_count: int) -> List[Question]:
        ts = int(time.time())
        q1 = Question(
            id=f"fb_dyn_{topic.lower().replace(' ', '_')[:10]}_{ts}_1",
            concept_id=f"topic_{topic.lower().replace(' ', '_')}",
            prompt=f"Diagnostic Check: In the study of {topic}, which principle is universally valid?",
            question_type="multiple_choice",
            options=[
                QuestionOption(id="o1", text="Equivalence and invariant conservation must be preserved across transformations.", misconception_id=None),
                QuestionOption(id="o2", text="Operations can be performed arbitrarily on one side without balancing.", misconception_id="sign_flip_omission", misconception_explanation="Violates invariant balance."),
                QuestionOption(id="o3", text="Units and variable coefficients can be ignored during substitution.", misconception_id="unlike_terms_merging", misconception_explanation="Incompatible dimensions cannot be merged."),
                QuestionOption(id="o4", text="All formulas apply equally regardless of boundary constraints.", misconception_id=None)
            ],
            correct_answer="Equivalence and invariant conservation must be preserved across transformations.",
            worked_solution=[
                f"1. Foundations of {topic} require strict conservation of balance.",
                "2. Any transformation applied to one side must be maintained on the other.",
                "3. Therefore, equivalence and invariant conservation are universally valid."
            ],
            difficulty=difficulty,
            source="curated",
            review_status=ContentReviewStatus.APPROVED,
            validation_status=ValidationStatus.VALID
        )
        q2 = Question(
            id=f"fb_dyn_{topic.lower().replace(' ', '_')[:10]}_{ts}_2",
            concept_id=f"topic_{topic.lower().replace(' ', '_')}",
            prompt=f"When encountering an edge case in {topic}, what is the correct diagnostic procedure?",
            question_type="multiple_choice",
            options=[
                QuestionOption(id="o1", text="Verify prerequisites and test against boundary values.", misconception_id=None),
                QuestionOption(id="o2", text="Force the standard formula without verifying domain limits.", misconception_id="formula_confusion", misconception_explanation="Formulas must have their prerequisites checked."),
                QuestionOption(id="o3", text="Skip the validation step if the initial answer looks plausible.", misconception_id=None),
                QuestionOption(id="o4", text="Assume that rounding errors cancel out boundary violations.", misconception_id=None)
            ],
            correct_answer="Verify prerequisites and test against boundary values.",
            worked_solution=[
                "1. Identify the domain of applicability for the current principle.",
                "2. Substitute boundary values to ensure stability.",
                "3. Verification against boundary constraints prevents false positives."
            ],
            difficulty=difficulty,
            source="curated",
            review_status=ContentReviewStatus.APPROVED,
            validation_status=ValidationStatus.VALID
        )
        return [q1, q2][:question_count]

    def _fallback_misconception_analysis(self, problem: str, student_answer: str, correct_answer: str, subject: str) -> Dict[str, Any]:
        return {
            "category": ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING,
            "misconception_id": "general_misconception",
            "confidence": 0.70,
            "evidence": f"Student response '{student_answer}' differs from expected '{correct_answer}'.",
            "remediation_hint": "Review the core definition and recompute using standard properties."
        }


gemini_service = GeminiService()

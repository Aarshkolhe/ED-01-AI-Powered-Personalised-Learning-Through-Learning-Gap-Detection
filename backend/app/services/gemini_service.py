"""
Google Gemini Provider Service for ThinkFlow AI.
Provides real AI tutor conversations, dynamic lesson generation,
dynamic assessment authoring, and generalized misconception detection
using the official Google Gemini API (generativelanguage.googleapis.com).

Delegates to GrokService deterministic fallback engine when
no API key is configured or the Gemini API is unreachable.
"""

import json
import time
import logging
from typing import Optional, Dict, Any, List, Tuple
import httpx

from app.core.config import settings
from app.models.schemas import (
    TutorChatMessage, TutorChatResponse,
    DynamicLesson, DynamicLessonRequest,
    StudentQuestion, StudentQuestionOption, Question, QuestionOption,
    ContentReviewStatus, ValidationStatus, ErrorTaxonomyCategory
)

logger = logging.getLogger("learnlens.gemini")


class GeminiService:
    def __init__(self):
        self.timeout = float(getattr(settings, "XAI_TIMEOUT_SECONDS", 15.0))
        self.max_tokens = int(getattr(settings, "XAI_MAX_TOKENS", 1500))
        self.max_retries = int(getattr(settings, "XAI_MAX_RETRIES", 2))

    @property
    def api_key(self) -> Optional[str]:
        k = settings.GEMINI_API_KEY
        if k and k.strip() and not k.strip().startswith("your-"):
            return k.strip()
        return None

    @property
    def model(self) -> str:
        return settings.GEMINI_MODEL

    def _api_url(self, json_mode: bool = False) -> str:
        return (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )

    def is_configured(self) -> bool:
        return self.api_key is not None

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
                "message": "GEMINI_API_KEY not configured or set to placeholder. Deterministic fallback active."
            }

        try:
            payload = {
                "contents": [{"parts": [{"text": "ping"}]}],
                "generationConfig": {"maxOutputTokens": 5}
            }
            with httpx.Client(timeout=min(self.timeout, 5.0)) as client:
                res = client.post(self._api_url(), json=payload)
                if res.status_code == 200:
                    return {
                        "status": "ready",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": False,
                        "message": "Google Gemini API connected and verified operational."
                    }
                elif res.status_code == 400:
                    # API key valid but bad request still means connectivity works
                    body = res.text.lower()
                    if "api key not valid" in body or "api_key_invalid" in body:
                        return {
                            "status": "invalid_key",
                            "provider": "Google Gemini",
                            "model": self.model,
                            "is_configured": True,
                            "is_fallback": True,
                            "message": "Provided GEMINI_API_KEY was rejected. Check your key at https://aistudio.google.com/apikey"
                        }
                    return {
                        "status": "ready",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": False,
                        "message": "Google Gemini API reachable."
                    }
                elif res.status_code == 401 or res.status_code == 403:
                    body = res.text.lower()
                    if "quota" in body or "billing" in body or "exceeded" in body:
                        return {
                            "status": "out_of_credits",
                            "provider": "Google Gemini",
                            "model": self.model,
                            "is_configured": True,
                            "is_fallback": True,
                            "message": "Gemini API quota exceeded or billing not enabled. Check https://aistudio.google.com/apikey"
                        }
                    return {
                        "status": "invalid_key",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": True,
                        "message": "Gemini API key rejected (401/403). Check your credentials."
                    }
                elif res.status_code == 429:
                    return {
                        "status": "rate_limited",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": True,
                        "message": "Gemini rate limit reached (429). Operating in fallback mode."
                    }
                else:
                    return {
                        "status": "error",
                        "provider": "Google Gemini",
                        "model": self.model,
                        "is_configured": True,
                        "is_fallback": True,
                        "message": f"Gemini returned HTTP {res.status_code}: {res.text[:120]}"
                    }
        except httpx.TimeoutException:
            return {
                "status": "provider_unavailable",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": True,
                "is_fallback": True,
                "message": "Gemini API timed out during health check. Operating in fallback mode."
            }
        except Exception as e:
            return {
                "status": "offline_fallback",
                "provider": "Google Gemini",
                "model": self.model,
                "is_configured": True,
                "is_fallback": True,
                "message": f"Connection check failed: {type(e).__name__}. Operating in fallback mode."
            }

    # ------------------------------------------------------------------
    # Core Gemini API call
    # ------------------------------------------------------------------
    def _call_gemini(self, messages: List[Dict[str, str]], json_mode: bool = False) -> Tuple[Optional[str], Optional[str]]:
        """
        Executes raw call to Google Gemini with retries, bounded backoff,
        and error translation.
        Returns: (response_text, error_message)
        """
        if not self.is_configured():
            return None, "GEMINI_API_KEY is not configured"

        # Build Gemini request format
        system_text = None
        contents = []
        for m in messages:
            role = m.get("role", "user")
            text = m.get("content", "")
            if role == "system":
                system_text = text
                continue
            # Gemini uses "model" for assistant role
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": text}]
            })

        # Ensure contents is not empty and starts with "user"
        if not contents:
            contents.append({"role": "user", "parts": [{"text": "Hello"}]})

        payload: Dict[str, Any] = {"contents": contents}

        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}

        gen_config: Dict[str, Any] = {
            "maxOutputTokens": self.max_tokens,
            "temperature": 0.2 if json_mode else 0.4
        }
        if json_mode:
            gen_config["responseMimeType"] = "application/json"
        payload["generationConfig"] = gen_config

        backoff = 1.0
        for attempt in range(self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(self._api_url(), json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip(), None
                        # Check for blocked content
                        if candidates and candidates[0].get("finishReason") == "SAFETY":
                            return None, "Response blocked by Gemini safety filters."
                        return None, "Empty response from Gemini"
                    elif resp.status_code in (400, 401, 403):
                        body = resp.text.lower()
                        if "api key not valid" in body or "api_key_invalid" in body:
                            logger.warning("Gemini API key rejected (key redacted)")
                            return None, "Invalid Gemini API Key. Please check your credentials at https://aistudio.google.com/apikey"
                        if "quota" in body or "billing" in body or "exceeded" in body:
                            logger.warning("Gemini API quota/billing issue (key redacted)")
                            return None, "Gemini API quota exceeded or billing not enabled."
                        if resp.status_code == 403:
                            logger.warning(f"Gemini API access denied: HTTP {resp.status_code} (key redacted)")
                            return None, "Gemini API access denied (403). Check API key permissions."
                        # 400 could be model not found
                        if "model" in body and ("not found" in body or "does not exist" in body):
                            logger.warning(f"Gemini model not found: {self.model}")
                            return None, f"Gemini model '{self.model}' not found. Check GEMINI_MODEL in .env"
                        return None, f"Gemini API error ({resp.status_code}): {resp.text[:200]}"
                    elif resp.status_code == 429:
                        if attempt < self.max_retries:
                            time.sleep(backoff)
                            backoff *= 2
                            continue
                        logger.warning("Gemini rate limit reached (HTTP 429).")
                        return None, "Gemini rate limit reached (429). Please try again shortly."
                    elif resp.status_code in (500, 502, 503, 504) and attempt < self.max_retries:
                        time.sleep(backoff)
                        backoff *= 2
                        continue
                    else:
                        return None, f"Gemini API Error ({resp.status_code}): {resp.text[:200]}"
            except httpx.TimeoutException:
                if attempt < self.max_retries:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                return None, "Request timed out"
            except Exception as e:
                if attempt < self.max_retries:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                return None, f"Network or execution error: {type(e).__name__}"

        return None, "Max retries exceeded"

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
        Conducts an interactive, multi-turn tutoring session across any subject/topic.
        Supports quick-action modifiers (simplify, analogy, worked_example, practice_question, summary).
        """
        system_prompt = (
            f"You are LearnLens AI, an expert, supportive, and pedagogical AI tutor in {subject}.\n"
            f"Current Topic: '{topic}' | Target Level: {level.capitalize()}.\n"
            "Pedagogical Guidelines:\n"
            "- Explain concepts clearly, encouraging curiosity without overwhelming jargon.\n"
            "- Use LaTeX equations (inline with $...$ or display with $$...$$) for mathematical and scientific expressions.\n"
            "- Use clean Markdown code blocks with syntax highlighting for programming topics.\n"
            "- If the student is confused, break down the concept into fundamental principles.\n"
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

        gemini_messages = [{"role": "system", "content": system_prompt + modifier_instruction}]
        for m in messages:
            gemini_messages.append({"role": m.role if m.role in ("user", "assistant") else "user", "content": m.content})

        content, err = self._call_gemini(gemini_messages, json_mode=False)

        if content and not err:
            clean_resp, followups = self._extract_followups(content)
            return TutorChatResponse(
                response=clean_resp,
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=followups,
                is_fallback=False,
                model=self.model
            )

        # Surface real errors — never silently replace with hardcoded text
        if self.is_configured() and err:
            err_code = "api_error"
            err_lower = err.lower()
            if "quota" in err_lower or "billing" in err_lower or "403" in err or "access denied" in err_lower:
                err_code = "out_of_credits"
            elif "401" in err or "invalid" in err_lower or "api key" in err_lower:
                err_code = "invalid_key"
            elif "429" in err or "rate limit" in err_lower:
                err_code = "rate_limited"

            return TutorChatResponse(
                response="",
                subject=subject,
                topic=topic,
                level=level,
                suggested_followups=[],
                is_fallback=False,
                model=self.model,
                error=err,
                error_code=err_code
            )

        # Deterministic fallback (only when GEMINI_API_KEY is not configured)
        from app.services.grok_service import grok_service
        return grok_service._fallback_tutor_response(subject, topic, level, action, messages)

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
        """Generates a comprehensive, pedagogical lesson."""
        obj_text = learning_objective or f"Master foundational and applied concepts of {topic}"
        system_instruction = (
            "You are a master curriculum designer and author for Thinkflow / LearnLens AI. "
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

        content, err = self._call_gemini([
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ], json_mode=True)

        if content and not err:
            try:
                cleaned = content.strip().replace("```json", "").replace("```", "").strip()
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
                logger.warning(f"Error parsing Gemini lesson JSON: {e}. Falling back.")

        from app.services.grok_service import grok_service
        return grok_service._fallback_lesson(subject, topic, level, obj_text, student_id)

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
        """Generates validated assessment questions."""
        system_instruction = (
            "You are a rigorous educational psychometrics item writer for Thinkflow. "
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

        content, err = self._call_gemini([
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ], json_mode=True)

        if content and not err:
            try:
                cleaned = content.strip().replace("```json", "").replace("```", "").strip()
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
                logger.warning(f"Error parsing Gemini questions: {e}. Falling back.")

        from app.services.grok_service import grok_service
        return grok_service._fallback_questions(subject, topic, difficulty, question_count)

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
        """Analyzes student response against the controlled error taxonomy."""
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
            s1, s2 = clean_stud.lower(), clean_corr.lower()
            if abs(len(s1) - len(s2)) <= 1:
                if len(s1) == len(s2):
                    diffs = [i for i in range(len(s1)) if s1[i] != s2[i]]
                    if len(diffs) == 1:
                        is_typo = True
                    elif len(diffs) == 2 and diffs[1] == diffs[0] + 1 and s1[diffs[0]] == s2[diffs[1]] and s1[diffs[1]] == s2[diffs[0]]:
                        is_typo = True
                else:
                    longer, shorter = (s1, s2) if len(s1) > len(s2) else (s2, s1)
                    for i in range(len(longer)):
                        if longer[:i] + longer[i+1:] == shorter:
                            is_typo = True
                            break
            if is_typo:
                return {
                    "category": ErrorTaxonomyCategory.POSSIBLE_TYPO,
                    "misconception_id": "single_char_slip",
                    "confidence": 0.85,
                    "evidence": f"Answer '{clean_stud}' differs by a single character or transposition from '{clean_corr}'.",
                    "remediation_hint": f"Double check your typing! You wrote '{clean_stud}', which looks like a simple slip for '{clean_corr}'."
                }

        # Attempt Gemini generalized analysis
        if self.is_configured():
            system_prompt = (
                "You are an expert cognitive learning diagnostician. "
                "Classify the student's error according to this strict taxonomy:\n"
                "- arithmetic_or_sign_error\n"
                "- concept_misunderstanding\n"
                "- formula_confusion\n"
                "- prerequisite_gap\n"
                "- question_misread\n"
                "- possible_typo\n"
                "- insufficient_evidence\n\n"
                "Return valid JSON:\n"
                "{\n"
                '  "category": "one of the taxonomy options above",\n'
                '  "misconception_id": "short_snake_case_name",\n'
                '  "confidence": float_between_0_and_1,\n'
                '  "evidence": "concise factual explanation",\n'
                '  "remediation_hint": "encouraging actionable student hint"\n'
                "}"
            )
            user_prompt = (
                f"Subject: {subject}\n"
                f"Problem: {problem}\n"
                f"Correct Answer: {correct_answer}\n"
                f"Student Answer: {student_answer}\n"
                f"Student Reasoning: {reasoning or 'None provided'}"
            )
            content, err = self._call_gemini([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ], json_mode=True)

            if content and not err:
                try:
                    data = json.loads(content.strip().replace("```json", "").replace("```", ""))
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

        # Deterministic fallback
        from app.services.grok_service import grok_service
        return grok_service._fallback_misconception_analysis(problem, clean_stud, clean_corr, subject)


gemini_service = GeminiService()

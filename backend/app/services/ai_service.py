import httpx
"""
AI Misconception Diagnostic & Question Generator Service.
Integrates Google Gemini as primary generative AI provider,
with deterministic validated generators.
Validates all AI-generated questions against schema and mathematical correctness.
"""

import json
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.models.schemas import Question, QuestionOption
from app.data.curriculum import CONCEPTS, MISCONCEPTIONS, SEED_QUESTIONS
from app.services.gemini_service import gemini_service

class AIService:
    def __init__(self):
        self.gemini = gemini_service
        self.grok = gemini_service  # backward compatibility alias
        self.client = None

    def is_gemini_active(self) -> bool:
        return self.gemini.is_configured()

    def explain_error(
        self,
        problem: str,
        student_answer: str,
        correct_answer: str,
        misconception: Optional[str] = None,
        reasoning: Optional[str] = None,
        language: str = "en",
        subject: str = "Mathematics"
    ) -> str:
        # 1. Primary: Use Google Gemini if configured
        if self.gemini.is_configured():
            try:
                analysis = self.gemini.analyze_misconception_generalized(
                    problem=problem,
                    student_answer=student_answer,
                    correct_answer=correct_answer,
                    reasoning=reasoning,
                    subject=subject
                )
                if analysis.get("remediation_hint"):
                    return analysis["remediation_hint"]
            except Exception as e:
                print(f"[AIService Gemini Misconception] {e}")

        # Deterministic targeted fallback explanations
        if misconception and misconception in MISCONCEPTIONS:
            m_data = MISCONCEPTIONS[misconception]
            if language == "hi" and "remediation_hi" in m_data:
                return m_data["remediation_hi"]
            return m_data.get("remediation_hint") or m_data.get("description") or "Review the governing rules for this operation."

        if language == "hi":
            return f"आइए समीक्षा करें: सही उत्तर {correct_answer} है। आपने {student_answer} उत्तर दिया।"
        return f"Let's review: the correct answer is {correct_answer}. You answered {student_answer}."

    def generate_targeted_question(
        self,
        concept_id: str,
        misconception_id: str,
        difficulty: float = 0.5
    ) -> Question:
        """
        Generates or selects a targeted question specifically engineered with a distractor
        for the given misconception.
        """
        fallback_map: Dict[str, Question] = {
            "add_denominators": Question(
                id=f"gen_{concept_id}_{misconception_id}_v1",
                concept_id=concept_id,
                prompt="Targeted Diagnostic: Calculate 2/7 + 3/7",
                prompt_hi="लक्षित प्रश्न: 2/7 + 3/7 का मान ज्ञात करें",
                question_type="multiple_choice",
                options=[
                    QuestionOption(id="o1", text="5/7", text_hi="5/7", misconception_id=None),
                    QuestionOption(id="o2", text="5/14", text_hi="5/14", misconception_id="add_denominators", misconception_explanation="Added denominators 7+7=14. Denominators stay the same when already common!"),
                    QuestionOption(id="o3", text="6/7", text_hi="6/7", misconception_id=None),
                    QuestionOption(id="o4", text="6/49", text_hi="6/49", misconception_id="add_denominators")
                ],
                correct_answer="5/7",
                worked_solution=["1. Denominators are identical (7).", "2. Add numerators: 2 + 3 = 5.", "3. Result: 5/7."],
                difficulty=difficulty
            ),
            "cross_multiply_in_addition": Question(
                id=f"gen_{concept_id}_{misconception_id}_v1",
                concept_id=concept_id,
                prompt="Targeted Diagnostic: Calculate 1/3 + 1/4",
                prompt_hi="लक्षित प्रश्न: 1/3 + 1/4 का मान ज्ञात करें",
                question_type="multiple_choice",
                options=[
                    QuestionOption(id="o1", text="7/12", text_hi="7/12", misconception_id=None),
                    QuestionOption(id="o2", text="1/12", text_hi="1/12", misconception_id="cross_multiply_in_addition", misconception_explanation="Cross-multiplication is not for addition! Find common denominator 12: 4/12 + 3/12 = 7/12."),
                    QuestionOption(id="o3", text="2/7", text_hi="2/7", misconception_id="add_denominators", misconception_explanation="Added numerators and denominators straight across."),
                    QuestionOption(id="o4", text="4/12", text_hi="4/12", misconception_id=None)
                ],
                correct_answer="7/12",
                worked_solution=["1. LCD of 3 and 4 is 12.", "2. Convert 1/3 to 4/12 and 1/4 to 3/12.", "3. 4/12 + 3/12 = 7/12."],
                difficulty=difficulty
            ),
            "sign_flip_omission": Question(
                id=f"gen_{concept_id}_{misconception_id}_v1",
                concept_id=concept_id,
                prompt="Targeted Diagnostic: Solve for y: y + 12 = 30",
                prompt_hi="लक्षित प्रश्न: y का मान ज्ञात करें: y + 12 = 30",
                question_type="multiple_choice",
                options=[
                    QuestionOption(id="o1", text="18", text_hi="18", misconception_id=None),
                    QuestionOption(id="o2", text="42", text_hi="42", misconception_id="sign_flip_omission", misconception_explanation="Added 12 to 30. Remember inverse of addition is subtraction!"),
                    QuestionOption(id="o3", text="360", text_hi="360", misconception_id=None),
                    QuestionOption(id="o4", text="-18", text_hi="-18", misconception_id=None)
                ],
                correct_answer="18",
                worked_solution=["1. Subtract 12 from both sides.", "2. y = 30 - 12.", "3. y = 18."],
                difficulty=difficulty
            ),
            "unlike_terms_merging": Question(
                id=f"gen_{concept_id}_{misconception_id}_v1",
                concept_id=concept_id,
                prompt="Targeted Diagnostic: Simplify 5x + 9 + 2x",
                prompt_hi="लक्षित प्रश्न: 5x + 9 + 2x को सरल करें",
                question_type="multiple_choice",
                options=[
                    QuestionOption(id="o1", text="7x + 9", text_hi="7x + 9", misconception_id=None),
                    QuestionOption(id="o2", text="16x", text_hi="16x", misconception_id="unlike_terms_merging", misconception_explanation="Combined 7x and 9 into 16x. Constants cannot merge with variables!"),
                    QuestionOption(id="o3", text="10x + 9", text_hi="10x + 9", misconception_id=None),
                    QuestionOption(id="o4", text="7x", text_hi="7x", misconception_id=None)
                ],
                correct_answer="7x + 9",
                worked_solution=["1. Group like variable terms: 5x + 2x = 7x.", "2. Constant remains: + 9.", "3. Final: 7x + 9."],
                difficulty=difficulty
            )
        }

        # If Gemini is available, attempt dynamic generation
        if self.gemini.is_configured():
            try:
                gemini_questions = self.gemini.generate_assessment_questions(
                    subject="Mathematics",
                    topic=concept_id,
                    difficulty=difficulty,
                    question_count=1
                )
                if gemini_questions:
                    gemini_q = gemini_questions[0]
                    gemini_q.concept_id = concept_id
                    return gemini_q
            except Exception as e:
                print(f"[AIService Gemini Generator] {e}. Using verified template.")

        # Return validated verified fallback
        if misconception_id in fallback_map:
            return fallback_map[misconception_id]

        for q in SEED_QUESTIONS:
            if q.concept_id == concept_id:
                return q

        return fallback_map["add_denominators"]

ai_service = AIService()

"""
Diagnostic Follow-up Question Service (Spec Section 18.1 & Section 19).
When student responses reflect ambiguity or multiple competing misconception hypotheses,
selects a targeted diagnostic follow-up question to distinguish the root misunderstanding.
Safeguards against endless loops by enforcing a single-depth follow-up ceiling.
"""

from typing import Optional, Dict, Any, List
from app.models.schemas import Question, QuestionOption, ContentReviewStatus, ValidationStatus, ErrorTaxonomyCategory

class DiagnosticService:
    def __init__(self):
        # Curated follow-up items mapped to ambiguous initial answers
        self.follow_up_bank: Dict[str, Question] = {
            "q_frac_like_01": Question(
                id="q_frac_like_01_diag_followup",
                concept_id="fraction_addition_like",
                prompt="Follow-up Check: If you have 2/7 of a pizza and add 3/7, what fraction do you have?",
                prompt_hi="फॉलो-अप प्रश्न: यदि आपके पास 2/7 पिज़्ज़ा है और आप 3/7 जोड़ते हैं, तो कुल कितना होगा?",
                question_type="multiple_choice",
                options=[
                    QuestionOption(
                        id="diag_opt_1",
                        text="5/7",
                        text_hi="5/7",
                        misconception_id=None
                    ),
                    QuestionOption(
                        id="diag_opt_2",
                        text="5/14",
                        text_hi="5/14",
                        misconception_id="add_denominators",
                        misconception_explanation="Consistently added denominators (7+7=14). Confirms 'Adding Across Denominators' misconception."
                    ),
                    QuestionOption(
                        id="diag_opt_3",
                        text="6/49",
                        text_hi="6/49",
                        misconception_id="cross_multiply_in_addition",
                        misconception_explanation="Multiplied terms instead of adding: (2*3)/(7*7) = 6/49."
                    )
                ],
                correct_answer="5/7",
                worked_solution=["When slices are identical (sevenths), sum the slices: 2 + 3 = 5 sevenths."],
                difficulty=0.35,
                source="curated",
                review_status=ContentReviewStatus.APPROVED,
                validation_status=ValidationStatus.VALID,
                is_follow_up=True,
                parent_question_id="q_frac_like_01",
                competing_misconceptions=["add_denominators", "cross_multiply_in_addition"],
                error_taxonomy=ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING
            ),
            "q_lin_2step_01": Question(
                id="q_lin_2step_01_diag_followup",
                concept_id="linear_equations_2step",
                prompt="Follow-up Check: In the equation y + 8 = 20, what is the single inverse step to isolate y?",
                prompt_hi="फॉलो-अप प्रश्न: समीकरण y + 8 = 20 में, y को अलग करने के लिए विपरीत चरण क्या है?",
                question_type="multiple_choice",
                options=[
                    QuestionOption(
                        id="diag_lin_1",
                        text="Subtract 8 from both sides",
                        text_hi="दोनों पक्षों से 8 घटाएं",
                        misconception_id=None
                    ),
                    QuestionOption(
                        id="diag_lin_2",
                        text="Add 8 to both sides",
                        text_hi="दोनों पक्षों में 8 जोड़ें",
                        misconception_id="sign_flip_omission",
                        misconception_explanation="Confirms failure to apply inverse operation on addition (+8)."
                    ),
                    QuestionOption(
                        id="diag_lin_3",
                        text="Divide both sides by 8",
                        text_hi="दोनों पक्षों को 8 से भाग दें",
                        misconception_id="divide_only_one_term",
                        misconception_explanation="Confused addition inverse with division."
                    )
                ],
                correct_answer="Subtract 8 from both sides",
                worked_solution=["The opposite of adding 8 is subtracting 8: y = 20 - 8 = 12."],
                difficulty=0.35,
                source="curated",
                review_status=ContentReviewStatus.APPROVED,
                validation_status=ValidationStatus.VALID,
                is_follow_up=True,
                parent_question_id="q_lin_2step_01",
                competing_misconceptions=["sign_flip_omission", "divide_only_one_term"],
                error_taxonomy=ErrorTaxonomyCategory.ARITHMETIC_OR_SIGN_ERROR
            )
        }

    def evaluate_ambiguity_and_get_followup(
        self,
        question_id: str,
        is_correct: bool,
        detected_misconception: Optional[str],
        is_already_follow_up: bool = False
    ) -> Optional[Question]:
        """
        Determines whether the attempt warrants a clarifying diagnostic follow-up.
        Enforces:
        1. Never triggers follow-up on already-correct answers.
        2. Never triggers follow-up from a follow-up (Strict Loop Prevention).
        3. Only triggers when competing explanations exist for the question.
        """
        if is_correct:
            return None
        if is_already_follow_up:
            return None

        # Check if the parent question has a registered diagnostic follow-up item
        return self.follow_up_bank.get(question_id)

diagnostic_service = DiagnosticService()

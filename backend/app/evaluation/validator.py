"""
Question Schema Validator and Duplicate Detector.
Validates AI-generated and authored questions against schema and pedagogical rules (Spec Section 18.4).
"""

from typing import Dict, Any, List, Set, Tuple

class QuestionSchemaValidator:
    @staticmethod
    def validate(
        question: Dict[str, Any],
        existing_prompts: Set[str] = None
    ) -> Tuple[bool, bool, List[str]]:
        """
        Validates question format.
        Returns:
            (is_valid, is_duplicate, error_messages)
        """
        errors: List[str] = []
        existing = existing_prompts or set()

        prompt = question.get("prompt", "")
        if not prompt or not isinstance(prompt, str) or len(prompt.strip()) < 5:
            errors.append("Prompt is missing or too short (minimum 5 characters required).")

        expected_answer = question.get("expectedAnswer") or question.get("correct_answer", "")
        if not expected_answer or not isinstance(expected_answer, str) or len(expected_answer.strip()) == 0:
            errors.append("Expected answer is missing.")

        difficulty = question.get("difficulty")
        if difficulty is not None:
            if not isinstance(difficulty, (int, float)) or difficulty < 1 or difficulty > 5:
                errors.append(f"Difficulty ({difficulty}) must be between 1 and 5.")

        concept_id = question.get("conceptId") or question.get("concept_id")
        if not concept_id or not isinstance(concept_id, str):
            errors.append("conceptId is required.")

        options = question.get("options")
        if options is not None:
            if not isinstance(options, list) or len(options) < 2:
                errors.append("Options must contain at least 2 choices.")
            else:
                opt_texts = [
                    o.get("text", "") if isinstance(o, dict) else str(o)
                    for o in options
                ]
                clean_opts = [t.strip().lower() for t in opt_texts]
                clean_ans = str(expected_answer).strip().lower()
                if clean_ans not in clean_opts:
                    errors.append(
                        f"Answer consistency violation: expected answer '{expected_answer}' is not present in options list."
                    )

        # Duplicate detection check
        normalized_prompt = str(prompt).strip().lower()
        is_duplicate = normalized_prompt in existing and len(normalized_prompt) >= 5
        if is_duplicate:
            errors.append("Duplicate question detected: an identical prompt already exists.")

        is_valid = len(errors) == 0
        return is_valid, is_duplicate, errors

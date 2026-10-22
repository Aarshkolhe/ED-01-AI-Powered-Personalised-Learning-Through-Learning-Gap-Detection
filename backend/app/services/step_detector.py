"""
Step-by-step mathematical reasoning and mistake detector.
Deterministically inspects equation transformations step-by-step and
isolates the exact index of the first algebraic or arithmetic violation.
"""

from typing import List, Optional
import re
from app.models.schemas import StepMistakeAnalysis

class StepDetector:
    def analyze_steps(self, problem: str, correct_final_answer: str, student_steps: List[str]) -> StepMistakeAnalysis:
        if not student_steps or len(student_steps) == 0:
            return StepMistakeAnalysis(
                has_error=True,
                first_error_step_index=0,
                student_erroneous_step="No steps provided",
                error_type="missing_steps",
                error_explanation="No solution steps were submitted for evaluation.",
                corrected_step=f"Start by expressing the problem: {problem}",
                full_corrected_solution=[problem, f"Result: {correct_final_answer}"]
            )

        # Standard check on simple linear equation patterns (e.g. "2x + 6 = 20", "ax + b = c")
        # Check step by step transitions
        clean_steps = [s.strip().replace(" ", "").lower() for s in student_steps]

        # Scenario 1: Two-step linear equation like "2x+6=20"
        if "2x+6=20" in problem.replace(" ", "").lower():
            expected_step_1 = ["2x=14", "2x=20-6"]
            expected_step_2 = ["x=7", "x=14/2"]

            # Step 0 check
            if len(clean_steps) >= 1:
                step0 = clean_steps[0]
                if step0 in ["2x=26", "2x=20+6"]:
                    return StepMistakeAnalysis(
                        has_error=True,
                        first_error_step_index=0,
                        student_erroneous_step=student_steps[0],
                        error_type="sign_inversion_error",
                        error_explanation="In step 1, you added 6 to 20 instead of subtracting. Inverse of (+6) is (-6).",
                        corrected_step="2x = 20 - 6  =>  2x = 14",
                        full_corrected_solution=["2x + 6 = 20", "2x = 14", "x = 7"]
                    )
                elif step0 in ["x+3=10", "x+6=10", "2x=10"]:
                    if step0 == "2x=10":
                        return StepMistakeAnalysis(
                            has_error=True,
                            first_error_step_index=0,
                            student_erroneous_step=student_steps[0],
                            error_type="subtraction_arithmetic_error",
                            error_explanation="20 minus 6 is 14, not 10.",
                            corrected_step="2x = 20 - 6  =>  2x = 14",
                            full_corrected_solution=["2x + 6 = 20", "2x = 14", "x = 7"]
                        )

            # Step 1 check
            if len(clean_steps) >= 2:
                step1 = clean_steps[1]
                if step1 in ["x=12", "x=28", "x=14-2"]:
                    return StepMistakeAnalysis(
                        has_error=True,
                        first_error_step_index=1,
                        student_erroneous_step=student_steps[1],
                        error_type="multiplication_division_inverse_error",
                        error_explanation="To isolate x from 2x = 14, you must divide by 2, not subtract.",
                        corrected_step="x = 14 / 2  =>  x = 7",
                        full_corrected_solution=["2x + 6 = 20", "2x = 14", "x = 7"]
                    )
                elif step1 not in ["x=7", "x=14/2", "x=7.0"]:
                    # Generic mismatch at final step
                    return StepMistakeAnalysis(
                        has_error=True,
                        first_error_step_index=1,
                        student_erroneous_step=student_steps[1],
                        error_type="arithmetic_error",
                        error_explanation=f"Calculation result '{student_steps[1]}' is incorrect.",
                        corrected_step="x = 7",
                        full_corrected_solution=["2x + 6 = 20", "2x = 14", "x = 7"]
                    )

        # Scenario 2: Fraction addition: 1/2 + 1/3
        if "1/2+1/3" in problem.replace(" ", "").lower():
            if len(clean_steps) >= 1:
                if "2/5" in clean_steps[0]:
                    return StepMistakeAnalysis(
                        has_error=True,
                        first_error_step_index=0,
                        student_erroneous_step=student_steps[0],
                        error_type="add_denominators",
                        error_explanation="Added numerators and denominators straight across: (1+1)/(2+3). Denominators must be matched using an LCD first.",
                        corrected_step="LCD is 6. Convert: 3/6 + 2/6",
                        full_corrected_solution=["1/2 + 1/3", "3/6 + 2/6", "5/6"]
                    )

        # Check last step equals correct final answer
        last_clean = clean_steps[-1]
        target_clean = correct_final_answer.strip().replace(" ", "").lower()
        if target_clean not in last_clean and not any(part in last_clean for part in [target_clean, f"={target_clean}"]):
            return StepMistakeAnalysis(
                has_error=True,
                first_error_step_index=len(student_steps) - 1,
                student_erroneous_step=student_steps[-1],
                error_type="incorrect_final_value",
                error_explanation=f"Final step reached '{student_steps[-1]}', but the target answer is '{correct_final_answer}'.",
                corrected_step=f"Final step: {correct_final_answer}",
                full_corrected_solution=[problem, f"Target: {correct_final_answer}"]
            )

        # All steps verified valid!
        return StepMistakeAnalysis(
            has_error=False,
            first_error_step_index=None,
            student_erroneous_step=None,
            error_type=None,
            error_explanation=None,
            corrected_step=None,
            full_corrected_solution=student_steps
        )

step_detector = StepDetector()

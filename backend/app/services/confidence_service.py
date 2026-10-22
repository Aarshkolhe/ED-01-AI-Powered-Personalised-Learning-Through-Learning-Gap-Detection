from typing import Optional, List, Dict, Any
from app.models.schemas import ConfidenceLevel, ConfidencePattern, ConfidenceInsight

class ConfidenceService:
    """
    Feature A — Confidence-Based Learning Insights Engine.
    Adheres strictly to Spec Section 18.2:
    - Never uses confidence alone to diagnose a misconception.
    - Never directly changes BKT mastery calculations.
    """

    @staticmethod
    def analyze_confidence(
        confidence: Optional[ConfidenceLevel],
        is_correct: bool
    ) -> ConfidenceInsight:
        if not confidence:
            return ConfidenceInsight(
                pattern=ConfidencePattern.UNSPECIFIED,
                level=None,
                title="Feedback Recorded",
                message="No confidence rating provided for this attempt.",
                suggested_action="Continue with recommended practice."
            )

        if not is_correct and confidence == ConfidenceLevel.HIGH:
            return ConfidenceInsight(
                pattern=ConfidencePattern.OVERCONFIDENCE,
                level=confidence,
                title="High Confidence with an Error Detected",
                message=(
                    "You felt very certain about this answer, but an unexpected error occurred. "
                    "This pattern commonly indicates a subtle sign slip, formula misapplication, "
                    "or an overlooked edge condition."
                ),
                suggested_action=(
                    "Review the step-by-step breakdown to pinpoint the exact step where your expectation diverged from the calculation."
                )
            )

        if is_correct and confidence == ConfidenceLevel.LOW:
            return ConfidenceInsight(
                pattern=ConfidencePattern.UNDERCONFIDENCE,
                level=confidence,
                title="Correct Answer with Low Confidence",
                message=(
                    "Great job! You arrived at the correct answer despite feeling unsure. "
                    "Your conceptual intuition is working better than you credited yourself for."
                ),
                suggested_action=(
                    "Complete 1-2 reinforcement questions on this concept to turn your intuitive understanding into solid confidence."
                )
            )

        if not is_correct and confidence in (ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM):
            return ConfidenceInsight(
                pattern=ConfidencePattern.CONSCIOUS_UNCERTAINTY,
                level=confidence,
                title="Self-Aware Learning Gap",
                message=(
                    "You correctly recognized your uncertainty on this question. "
                    "Being aware of what you do not know is a powerful meta-cognitive advantage."
                ),
                suggested_action="Focus on reviewing the core prerequisite concept before attempting a higher-difficulty problem."
            )

        return ConfidenceInsight(
            pattern=ConfidencePattern.MASTERY_ALIGNMENT,
            level=confidence,
            title="Strong Mastery & Confidence Alignment",
            message="Your confidence matches your accurate execution. You have a solid grasp of this problem type.",
            suggested_action="You are ready to attempt a more challenging question or advance to the next concept."
        )

    @staticmethod
    def summarize_patterns(attempts: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_rated = 0
        overconfidence_count = 0
        underconfidence_count = 0
        aligned_count = 0

        for att in attempts:
            conf = att.get("confidence")
            if not conf:
                continue
            total_rated += 1
            is_correct = att.get("is_correct", False)
            insight = ConfidenceService.analyze_confidence(conf, is_correct)
            if insight.pattern == ConfidencePattern.OVERCONFIDENCE:
                overconfidence_count += 1
            elif insight.pattern == ConfidencePattern.UNDERCONFIDENCE:
                underconfidence_count += 1
            elif insight.pattern == ConfidencePattern.MASTERY_ALIGNMENT:
                aligned_count += 1

        summary = "Keep solving questions to help us calibrate your confidence insights."
        if total_rated >= 3:
            if overconfidence_count >= 2:
                summary = "You have encountered a few surprises where you felt confident but missed a calculation step. Take extra care to verify algebraic signs."
            elif underconfidence_count >= 2:
                summary = "You frequently answer correctly even when unsure. Trust your instincts more—you know more than you think!"
            elif total_rated > 0 and (aligned_count / total_rated) >= 0.7:
                summary = "Your self-assessed confidence closely matches your actual understanding."

        alignment_rate = round(aligned_count / total_rated, 2) if total_rated > 0 else 0.0

        return {
            "total_rated_attempts": total_rated,
            "overconfidence_count": overconfidence_count,
            "underconfidence_count": underconfidence_count,
            "alignment_rate": alignment_rate,
            "insight_summary": summary
        }

confidence_service = ConfidenceService()

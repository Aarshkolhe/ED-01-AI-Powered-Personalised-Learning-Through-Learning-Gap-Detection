"""
Remediation and Recovery Engine.
Generates prerequisite learning paths and computes Learning Recovery Scores.
"""

from typing import List, Dict, Any, Optional
from app.data.curriculum import CONCEPTS, MISCONCEPTIONS
from app.models.schemas import RecoveryPlan, RecoveryScoreReport

class RecoveryEngine:
    def __init__(self):
        self.concepts_by_id = {c.id: c for c in CONCEPTS}

    def generate_recovery_path(self, student_id: str, focal_concept_id: str, student_mastery_map: Dict[str, float]) -> RecoveryPlan:
        focal_concept = self.concepts_by_id.get(focal_concept_id)
        if not focal_concept:
            focal_concept = CONCEPTS[0]

        # Traverse prerequisites recursively to find unmastered ancestors
        visited = set()
        prereq_chain = []

        def traverse(cid: str):
            c = self.concepts_by_id.get(cid)
            if not c:
                return
            for pid in c.prerequisites:
                if pid not in visited:
                    visited.add(pid)
                    traverse(pid)
                    prereq_chain.append(pid)

        traverse(focal_concept.id)

        # Identify which prerequisites have low mastery (< 0.70)
        active_gaps = []
        ordered_remediation = []

        for pid in prereq_chain:
            p_mastery = student_mastery_map.get(pid, 0.20)
            p_obj = self.concepts_by_id.get(pid)
            if p_mastery < 0.70:
                active_gaps.append(pid)
                ordered_remediation.append({
                    "concept_id": pid,
                    "concept_name": p_obj.name if p_obj else pid,
                    "current_mastery": p_mastery,
                    "priority": "HIGH",
                    "reason": "Foundational prerequisite with detected conceptual weakness."
                })

        # Append focal concept itself as destination
        focal_mastery = student_mastery_map.get(focal_concept.id, 0.20)
        ordered_remediation.append({
            "concept_id": focal_concept.id,
            "concept_name": focal_concept.name,
            "current_mastery": focal_mastery,
            "priority": "TARGET",
            "reason": "Target concept to achieve mastery after foundational recovery."
        })

        recommended_activities = [
            {
                "id": "act_01",
                "title": f"Review Core Model: {ordered_remediation[0]['concept_name']}",
                "type": "concept_breakdown",
                "estimated_minutes": 5,
                "description": "Visual walkthrough with concrete worked examples to reset intuition."
            },
            {
                "id": "act_02",
                "title": "Interactive Misconception Dissection",
                "type": "error_contrast",
                "estimated_minutes": 7,
                "description": "Side-by-side comparison of erroneous traps vs correct transformations."
            },
            {
                "id": "act_03",
                "title": f"Targeted Reassessment: {focal_concept.name}",
                "type": "post_assessment",
                "estimated_minutes": 8,
                "description": "Fresh diagnostic assessment to verify whether the learning gap has been closed."
            }
        ]

        return RecoveryPlan(
            student_id=student_id,
            focal_concept_id=focal_concept.id,
            focal_concept_name=focal_concept.name,
            active_gaps=active_gaps,
            prerequisite_remediation_order=ordered_remediation,
            recommended_activities=recommended_activities,
            estimated_duration_minutes=20
        )

    def calculate_recovery_score(
        self,
        student_id: str,
        concept_id: str,
        pre_scores: List[float],
        post_scores: List[float]
    ) -> RecoveryScoreReport:
        """
        Calculates Learning Recovery Score comparing pre-remediation baseline
        to post-remediation performance.
        LRS = ((post_mean - pre_mean) / max(0.10, (1.0 - pre_mean))) * 100
        Honestly handles zero baselines, missing post-assessments, and failed reassessments.
        """
        concept = self.concepts_by_id.get(concept_id)
        concept_name = concept.name if concept else concept_id

        # Case 1: No assessments at all
        if not pre_scores and not post_scores:
            return RecoveryScoreReport(
                student_id=student_id,
                concept_id=concept_id,
                concept_name=concept_name,
                pre_score=0.0,
                post_score=0.0,
                score_delta=0.0,
                recovery_percentage=0.0,
                concepts_improved=[],
                remaining_gaps=[concept_name],
                baseline_attempts=0,
                post_attempts=0,
                status="No Assessment Data",
                disclaimer="No diagnostic or reassessment attempts recorded yet for this concept."
            )

        # Calculate pre-remediation baseline
        pre_attempts = len(pre_scores)
        pre_mean = round(sum(pre_scores) / pre_attempts, 3) if pre_attempts > 0 else 0.0

        # Case 2: Pre-remediation completed, but no post-remediation reassessment yet
        if not post_scores:
            return RecoveryScoreReport(
                student_id=student_id,
                concept_id=concept_id,
                concept_name=concept_name,
                pre_score=pre_mean,
                post_score=0.0,
                score_delta=0.0,
                recovery_percentage=0.0,
                concepts_improved=[],
                remaining_gaps=[concept_name],
                baseline_attempts=pre_attempts,
                post_attempts=0,
                status="Awaiting Reassessment",
                disclaimer=f"Baseline diagnostic recorded ({pre_attempts} attempt{'s' if pre_attempts > 1 else ''}). Complete the targeted reassessment to measure learning recovery."
            )

        # Case 3: Both pre and post scores exist
        post_attempts = len(post_scores)
        post_mean = round(sum(post_scores) / post_attempts, 3)
        delta = round(post_mean - pre_mean, 3)

        # Potential room for growth
        potential_growth = max(0.10, 1.0 - pre_mean)

        improved = []
        remaining = []

        if delta > 0.0:
            recovery_pct = round(max(0.0, min(100.0, (delta / potential_growth) * 100.0)), 1)
            improved.append(concept_name)
            if delta >= 0.50:
                status = "Significant Recovery"
            else:
                status = "Moderate Improvement"
            disclaimer = f"Progress observed from baseline ({round(pre_mean*100)}%) to reassessment ({round(post_mean*100)}%)."
        else:
            # Reassessment showed no improvement or regress
            recovery_pct = 0.0
            remaining.append(concept_name)
            status = "Needs Further Practice"
            disclaimer = f"Post-remediation assessment scored {round(post_mean*100)}%. Target conceptual gap requires further instruction and practice."

        return RecoveryScoreReport(
            student_id=student_id,
            concept_id=concept_id,
            concept_name=concept_name,
            pre_score=pre_mean,
            post_score=post_mean,
            score_delta=delta,
            recovery_percentage=recovery_pct,
            concepts_improved=improved,
            remaining_gaps=remaining,
            baseline_attempts=pre_attempts,
            post_attempts=post_attempts,
            status=status,
            disclaimer=disclaimer
        )

recovery_engine = RecoveryEngine()

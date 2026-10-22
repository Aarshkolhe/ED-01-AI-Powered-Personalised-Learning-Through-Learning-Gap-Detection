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
        LRS = ((post_mean - pre_mean) / max(0.01, (1.0 - pre_mean))) * 100
        Bounded realistically and labeled strictly as an instructional progress metric.
        """
        concept = self.concepts_by_id.get(concept_id)
        concept_name = concept.name if concept else concept_id

        if not pre_scores:
            pre_mean = 0.0
        else:
            pre_mean = round(sum(pre_scores) / len(pre_scores), 3)

        if not post_scores:
            post_mean = pre_mean
        else:
            post_mean = round(sum(post_scores) / len(post_scores), 3)

        delta = round(post_mean - pre_mean, 3)

        # Potential room for growth
        potential_growth = max(0.10, 1.0 - pre_mean)
        recovery_pct = round(max(0.0, min(100.0, (delta / potential_growth) * 100.0)), 1)

        improved = []
        remaining = []
        if delta > 0.15:
            improved.append(concept_name)
            status = "Significant Recovery"
        elif delta > 0:
            improved.append(concept_name)
            status = "Moderate Improvement"
        else:
            remaining.append(concept_name)
            status = "Needs Further Practice"

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
            baseline_attempts=len(pre_scores),
            post_attempts=len(post_scores),
            status=status
        )

recovery_engine = RecoveryEngine()

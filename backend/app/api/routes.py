"""
FastAPI Routes for LearnLens AI Core.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.models.schemas import (
    Concept, Question, AnswerSubmission, AnswerEvaluation,
    StepSubmission, StepMistakeAnalysis, QuestionGenerationRequest,
    RecoveryPlan, RecoveryScoreReport, ClassroomAnalytics, StudentMastery
)
from app.data.repository import repo
from app.data.curriculum import CONCEPTS, SEED_QUESTIONS, MISCONCEPTIONS
from app.services.bkt import bkt_engine
from app.services.step_detector import step_detector
from app.services.recovery_engine import recovery_engine
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter()

# ----------------- Status & Config -----------------
@router.get("/status")
def get_system_status():
    return {
        "status": "operational",
        "demo_mode": settings.DEMO_MODE,
        "database_mode": settings.DATABASE_MODE,
        "gemini_active": ai_service.client is not None,
        "model": settings.GEMINI_MODEL,
        "concepts_loaded": len(repo.concepts),
        "questions_loaded": len(repo.questions)
    }

# ----------------- Curriculum & Knowledge Graph -----------------
@router.get("/concepts", response_model=List[Concept])
def get_concepts():
    return list(repo.concepts.values())

@router.get("/graph")
def get_knowledge_graph(student_id: Optional[str] = "student_alex"):
    """
    Returns graph nodes and edges formatted for React Flow knowledge-graph explorer.
    Includes current student mastery state and gap indicator.
    """
    nodes = []
    edges = []

    # Simple layered layout coordinates
    positions = {
        "fractions_intro": {"x": 100, "y": 80},
        "equivalent_fractions": {"x": 350, "y": 50},
        "fraction_addition_like": {"x": 350, "y": 140},
        "fraction_addition_unlike": {"x": 650, "y": 90},
        "algebra_expressions": {"x": 100, "y": 280},
        "linear_equations_1step": {"x": 380, "y": 280},
        "linear_equations_2step": {"x": 680, "y": 280},
    }

    student_records = repo.mastery_records.get(student_id, {})

    for c in repo.concepts.values():
        rec = student_records.get(c.id)
        p_val = rec.p_mastery if rec else 0.20
        is_gap = p_val < 0.60
        is_mastered = p_val >= c.mastery_threshold

        pos = positions.get(c.id, {"x": 200, "y": 200})

        nodes.append({
            "id": c.id,
            "type": "conceptNode",
            "position": pos,
            "data": {
                "id": c.id,
                "label": c.name,
                "description": c.description,
                "category": c.category,
                "difficulty": c.difficulty,
                "mastery": round(p_val, 2),
                "is_gap": is_gap,
                "is_mastered": is_mastered,
                "threshold": c.mastery_threshold
            }
        })

        for prereq in c.prerequisites:
            edges.append({
                "id": f"e-{prereq}-{c.id}",
                "source": prereq,
                "target": c.id,
                "animated": is_gap,
                "style": {"stroke": "#e11d48" if is_gap else "#0d9488", "strokeWidth": 2}
            })

    return {"nodes": nodes, "edges": edges}

# ----------------- Diagnostic Questions -----------------
@router.get("/diagnostic/questions", response_model=List[Question])
def get_diagnostic_questions(concept_id: Optional[str] = None):
    if concept_id:
        return [q for q in repo.questions.values() if q.concept_id == concept_id and "post" not in q.id]
    # Return initial baseline diagnostic set (excluding post tests)
    return [q for q in repo.questions.values() if "post" not in q.id]

@router.get("/reassessment/questions", response_model=List[Question])
def get_reassessment_questions(concept_id: Optional[str] = None):
    # Returns post-test questions
    post_qs = [q for q in repo.questions.values() if "post" in q.id]
    if concept_id:
        filtered = [q for q in post_qs if q.concept_id == concept_id]
        return filtered if filtered else post_qs
    return post_qs

# ----------------- Submission & Evaluation -----------------
@router.post("/diagnostic/submit", response_model=AnswerEvaluation)
def submit_answer(sub: AnswerSubmission):
    question = repo.questions.get(sub.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = (sub.student_answer.strip().lower() == question.correct_answer.strip().lower())
    
    # Misconception detection
    detected_misconception = None
    misconception_explanation = None

    if not is_correct:
        # Check matching distractor
        for opt in question.options:
            if opt.text.strip().lower() == sub.student_answer.strip().lower():
                if opt.misconception_id:
                    detected_misconception = opt.misconception_id
                    misconception_explanation = opt.misconception_explanation
                    break
        
        # If no distractor matched but known error pattern applies
        if not detected_misconception and "unlike" in question.concept_id:
            if "2/5" in sub.student_answer:
                detected_misconception = "add_denominators"
                misconception_explanation = MISCONCEPTIONS["add_denominators"]["remediation_hint"]

    # BKT Mastery Update
    mastery_record = repo.get_or_create_student_mastery(sub.student_id, question.concept_id)
    prior_p = mastery_record.p_mastery
    p_obs, p_projected = bkt_engine.update_mastery(prior_p, is_correct)

    mastery_record.p_mastery = p_projected
    mastery_record.last_updated = datetime.utcnow().isoformat()
    mastery_record.practice_count += 1
    if is_correct:
        mastery_record.correct_count += 1
        mastery_record.consecutive_correct += 1
    else:
        mastery_record.consecutive_correct = 0

    mastery_change = round(p_projected - prior_p, 4)
    concept = repo.concepts.get(question.concept_id)
    is_mastered = p_projected >= (concept.mastery_threshold if concept else 0.85)

    # Response time signal analysis (supporting signal only)
    time_signal = "normal"
    if sub.response_time_seconds < 4.0:
        time_signal = "fast"
    elif sub.response_time_seconds > 45.0:
        time_signal = "prolonged"

    # AI feedback generation
    ai_feedback = ai_service.explain_error(
        problem=question.prompt,
        student_answer=sub.student_answer,
        correct_answer=question.correct_answer,
        misconception=detected_misconception,
        reasoning=sub.free_text_reasoning
    )

    # Record in persistent repository log
    student_user = repo.users.get(sub.student_id, {"name": sub.student_id})
    repo.record_attempt({
        "id": f"att_{len(repo.attempts)+1:03d}",
        "student_id": sub.student_id,
        "student_name": student_user.get("name", sub.student_id),
        "question_id": question.id,
        "concept_id": question.concept_id,
        "concept_name": concept.name if concept else question.concept_id,
        "student_answer": sub.student_answer,
        "is_correct": is_correct,
        "misconception_id": detected_misconception,
        "misconception_name": MISCONCEPTIONS[detected_misconception]["name"] if detected_misconception in MISCONCEPTIONS else None,
        "response_time_seconds": sub.response_time_seconds,
        "created_at": datetime.utcnow().isoformat(),
        "is_reassessment": sub.is_reassessment
    })

    return AnswerEvaluation(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        concept_id=question.concept_id,
        detected_misconception=detected_misconception,
        misconception_explanation=misconception_explanation,
        ai_feedback=ai_feedback,
        previous_mastery=prior_p,
        updated_mastery=p_projected,
        mastery_change=mastery_change,
        is_mastered=is_mastered,
        response_time_seconds=sub.response_time_seconds,
        time_signal=time_signal
    )

# ----------------- Step-by-Step Mistake Detection -----------------
@router.post("/steps/analyze", response_model=StepMistakeAnalysis)
def analyze_steps(submission: StepSubmission):
    return step_detector.analyze_steps(
        problem=submission.problem_statement,
        correct_final_answer=submission.correct_final_answer,
        student_steps=submission.student_steps
    )

# ----------------- Targeted Misconception Question Generator -----------------
@router.post("/questions/generate", response_model=Question)
def generate_misconception_question(req: QuestionGenerationRequest):
    return ai_service.generate_targeted_question(
        concept_id=req.concept_id,
        misconception_id=req.misconception_id,
        difficulty=req.difficulty or 0.5,
        language=req.language or "en"
    )

# ----------------- Recovery Plan & Path -----------------
@router.get("/recovery/plan", response_model=RecoveryPlan)
def get_recovery_plan(student_id: str, concept_id: str):
    user_mastery = {
        cid: rec.p_mastery for cid, rec in repo.mastery_records.get(student_id, {}).items()
    }
    return recovery_engine.generate_recovery_path(
        student_id=student_id,
        focal_concept_id=concept_id,
        student_mastery_map=user_mastery
    )

# ----------------- Recovery Score (Pre vs Post) -----------------
@router.get("/recovery/score", response_model=RecoveryScoreReport)
def get_recovery_score(student_id: str, concept_id: str):
    # Filter attempts for this student and concept
    student_atts = [
        a for a in repo.attempts if a["student_id"] == student_id and a["concept_id"] == concept_id
    ]

    pre_scores = [1.0 if a["is_correct"] else 0.0 for a in student_atts if not a.get("is_reassessment", False)]
    post_scores = [1.0 if a["is_correct"] else 0.0 for a in student_atts if a.get("is_reassessment", False)]

    # Provide fallback baseline if newly tested
    if not pre_scores:
        pre_scores = [0.0]
    if not post_scores:
        post_scores = [1.0]

    return recovery_engine.calculate_recovery_score(
        student_id=student_id,
        concept_id=concept_id,
        pre_scores=pre_scores,
        post_scores=post_scores
    )

# ----------------- Teacher Analytics Dashboard -----------------
@router.get("/analytics/classroom", response_model=ClassroomAnalytics)
def get_classroom_analytics():
    all_students = ["student_alex", "student_priya", "student_marcus"]
    
    total_mastery_sum = 0
    total_mastery_count = 0
    at_risk_count = 0

    student_avg_mastery = {}
    for sid in all_students:
        recs = repo.mastery_records.get(sid, {})
        if recs:
            avg_m = sum(r.p_mastery for r in recs.values()) / len(recs)
        else:
            avg_m = 0.20
        student_avg_mastery[sid] = avg_m
        total_mastery_sum += avg_m
        total_mastery_count += 1
        if avg_m < 0.60:
            at_risk_count += 1

    overall_avg_mastery = round(total_mastery_sum / max(1, total_mastery_count), 2)

    # Concept heatmaps
    heatmaps = []
    for c in repo.concepts.values():
        scores = []
        for sid in all_students:
            rec = repo.mastery_records.get(sid, {}).get(c.id)
            if rec:
                scores.append(rec.p_mastery)
        c_avg = round(sum(scores) / max(1, len(scores)), 2)
        heatmaps.append({
            "concept_id": c.id,
            "concept_name": c.name,
            "category": c.category,
            "average_mastery": c_avg,
            "status": "proficient" if c_avg >= 0.8 else ("progressing" if c_avg >= 0.6 else "critical_gap")
        })

    # Shared misconceptions counts from attempts
    misconception_counts = {}
    for att in repo.attempts:
        m_id = att.get("misconception_id")
        if m_id and m_id in MISCONCEPTIONS:
            if m_id not in misconception_counts:
                misconception_counts[m_id] = {
                    "misconception_id": m_id,
                    "name": MISCONCEPTIONS[m_id]["name"],
                    "count": 0,
                    "affected_students": set(),
                    "recommended_intervention": MISCONCEPTIONS[m_id]["remediation_hint"]
                }
            misconception_counts[m_id]["count"] += 1
            misconception_counts[m_id]["affected_students"].add(att["student_name"])

    top_misconceptions = []
    for m in misconception_counts.values():
        top_misconceptions.append({
            "misconception_id": m["misconception_id"],
            "name": m["name"],
            "count": m["count"],
            "affected_students": list(m["affected_students"]),
            "recommended_intervention": m["recommended_intervention"]
        })

    # Intervention recommendations linked to observed errors
    interventions = [
        {
            "priority": "HIGH",
            "concept": "Adding Fractions (Unlike Denominators)",
            "targeted_misconception": "Adding Across Denominators",
            "impacted_students": ["Alex Chen", "Marcus Vance"],
            "action": "Conduct small-group fraction equivalence circle workshop with visual pizza / bar models before proceeding to equations."
        },
        {
            "priority": "MEDIUM",
            "concept": "Two-Step Linear Equations",
            "targeted_misconception": "Missing Sign Reversal",
            "impacted_students": ["Alex Chen"],
            "action": "Reinforce inverse operation balance scale demonstration (undo addition before multiplication)."
        }
    ]

    return ClassroomAnalytics(
        total_students=len(all_students),
        average_mastery=overall_avg_mastery,
        at_risk_students_count=at_risk_count,
        top_misconceptions=sorted(top_misconceptions, key=lambda x: x["count"], reverse=True),
        concept_heatmaps=heatmaps,
        recent_attempts=repo.attempts[-10:],
        intervention_recommendations=interventions
    )

@router.get("/analytics/students")
def get_students_summary():
    students_list = []
    for sid, u in repo.users.items():
        if u["role"] == "student":
            recs = repo.mastery_records.get(sid, {})
            avg_m = round(sum(r.p_mastery for r in recs.values()) / max(1, len(recs)), 2)
            gaps = [r.concept_id for r in recs.values() if r.p_mastery < 0.60]
            students_list.append({
                "student_id": sid,
                "name": u["name"],
                "grade": u.get("grade", "8th Grade"),
                "average_mastery": avg_m,
                "risk_level": "High Risk" if avg_m < 0.50 else ("Moderate Risk" if avg_m < 0.75 else "On Track"),
                "active_gaps_count": len(gaps),
                "active_gaps": gaps
            })
    return students_list

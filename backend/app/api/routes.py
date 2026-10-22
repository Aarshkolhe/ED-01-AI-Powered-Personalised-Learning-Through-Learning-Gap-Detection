"""
FastAPI Routes for Thinkflow Core.
Includes full integration of Features A-F:
- Feature A: Confidence-Based Learning Insights
- Feature B: Spaced Revision & Intelligent Practice Scheduling
- Feature C: Explainable Recommendations with Reason Codes
- Feature D: Teacher Review of AI-Generated Content & Quality Gate
- Feature F: Student Feedback and Content Reporting
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone

from app.models.schemas import (
    Concept, Question, StudentQuestion, StudentQuestionOption, AnswerSubmission, AnswerEvaluation,
    StepSubmission, StepMistakeAnalysis, QuestionGenerationRequest,
    RecoveryPlan, RecoveryScoreReport, ClassroomAnalytics, StudentMastery,
    ConfidenceLevel, RevisionSchedule, RevisionStatus, Recommendation, RecommendationReasonCode,
    ContentReviewStatus, ContentReport, ContentReportReason, ContentReportStatus,
    ErrorTaxonomyCategory, SupportSignal, StudentSummary, BKTModelVersion
)
from app.data.repository import repo
from app.data.curriculum import CONCEPTS, SEED_QUESTIONS, MISCONCEPTIONS
from app.services.bkt import bkt_engine
from app.services.step_detector import step_detector
from app.services.recovery_engine import recovery_engine
from app.services.ai_service import ai_service
from app.services.confidence_service import confidence_service
from app.services.spaced_revision import spaced_revision_service
from app.services.recommendation_service import recommendation_service
from app.services.content_review_service import content_review_service
from app.services.graph_service import graph_service
from app.services.diagnostic_service import diagnostic_service
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

# ----------------- Diagnostic Questions (Feature D Quality Gate Filtered & Safe Client View) -----------------
@router.get("/diagnostic/questions", response_model=List[StudentQuestion])
def get_diagnostic_questions(concept_id: Optional[str] = None):
    # Enforce Feature D Quality Gate: Filter out unapproved, draft, or disabled questions
    eligible = content_review_service.filter_student_eligible_questions(list(repo.questions.values()))
    # Omit post-reassessment items and follow-up items from the general diagnostic pool
    candidates = [q for q in eligible if "post" not in q.id and not getattr(q, "is_follow_up", False)]
    if concept_id:
        filtered = [q.to_student_view() for q in candidates if q.concept_id == concept_id]
        return filtered if filtered else [q.to_student_view() for q in candidates]
    return [q.to_student_view() for q in candidates]

@router.get("/reassessment/questions", response_model=List[StudentQuestion])
def get_reassessment_questions(concept_id: Optional[str] = None):
    eligible = content_review_service.filter_student_eligible_questions(list(repo.questions.values()))
    post_qs = [q for q in eligible if "post" in q.id and not getattr(q, "is_follow_up", False)]
    if concept_id:
        filtered = [q.to_student_view() for q in post_qs if q.concept_id == concept_id]
        return filtered if filtered else [q.to_student_view() for q in post_qs]
    return [q.to_student_view() for q in post_qs]

def map_misconception_to_taxonomy(misconception_id: Optional[str], student_answer: str, is_correct: bool) -> ErrorTaxonomyCategory:
    if is_correct:
        return ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE
    if not student_answer or not student_answer.strip():
        return ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE
    if not misconception_id:
        return ErrorTaxonomyCategory.INSUFFICIENT_EVIDENCE

    taxonomy_map = {
        "add_denominators": ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING,
        "unlike_terms_merging": ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING,
        "cross_multiply_in_addition": ErrorTaxonomyCategory.FORMULA_CONFUSION,
        "sign_flip_omission": ErrorTaxonomyCategory.ARITHMETIC_OR_SIGN_ERROR,
        "divide_only_one_term": ErrorTaxonomyCategory.ARITHMETIC_OR_SIGN_ERROR,
    }
    return taxonomy_map.get(misconception_id, ErrorTaxonomyCategory.CONCEPT_MISUNDERSTANDING)

# ----------------- Submission & Evaluation (Features A, B, and Follow-ups Integrated) -----------------
@router.post("/diagnostic/submit", response_model=AnswerEvaluation)
def submit_answer(sub: AnswerSubmission):
    question = repo.questions.get(sub.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Idempotency check: prevent duplicate submissions from double-counting BKT
    if sub.idempotency_key:
        for att in repo.attempts:
            if att.get("idempotency_key") == sub.idempotency_key:
                raise HTTPException(status_code=409, detail="This attempt has already been processed.")

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

    error_taxonomy = map_misconception_to_taxonomy(detected_misconception, sub.student_answer, is_correct)

    # Spec §18.1 & §19: Diagnostic Follow-up Disambiguation
    follow_up_item = diagnostic_service.evaluate_ambiguity_and_get_followup(
        question_id=question.id,
        is_correct=is_correct,
        detected_misconception=detected_misconception,
        is_already_follow_up=getattr(question, "is_follow_up", False)
    )
    needs_follow_up = follow_up_item is not None
    follow_up_student_view = follow_up_item.to_student_view() if follow_up_item else None

    # Feature A: Confidence Insight
    # CRITICAL: Confidence is strictly isolated and NEVER alters BKT inputs!
    confidence_insight = confidence_service.analyze_confidence(sub.confidence, is_correct)

    # Pure BKT Mastery Update
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

    # Feature B: Update Spaced Revision Schedule
    if sub.student_id not in repo.revision_schedules:
        repo.revision_schedules[sub.student_id] = {}

    concept_name = concept.name if concept else question.concept_id
    next_interval = spaced_revision_service.calculate_next_interval(
        mastery_record.practice_count,
        p_projected,
        is_correct
    )
    now_dt = datetime.utcnow()
    next_due_dt = now_dt + timedelta(days=next_interval)
    rationale = spaced_revision_service.generate_rationale(
        concept_name,
        0,
        p_projected,
        False,
        0 if is_correct else 1
    )

    repo.revision_schedules[sub.student_id][question.concept_id] = RevisionSchedule(
        id=f"rev_{sub.student_id}_{question.concept_id}",
        student_id=sub.student_id,
        concept_id=question.concept_id,
        concept_title=concept_name,
        last_practiced_at=now_dt.isoformat(),
        next_review_due_at=next_due_dt.isoformat(),
        interval_days=next_interval,
        repetitions_count=mastery_record.practice_count,
        mastery_probability=p_projected,
        status=RevisionStatus.SCHEDULED,
        recommendation_rationale=rationale
    )

    # Response time signal analysis
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

    # Record attempt log
    student_user = repo.users.get(sub.student_id, {"name": sub.student_id})
    repo.record_attempt({
        "id": f"att_{len(repo.attempts)+1:03d}",
        "student_id": sub.student_id,
        "student_name": student_user.get("name", sub.student_id),
        "question_id": question.id,
        "concept_id": question.concept_id,
        "concept_name": concept_name,
        "student_answer": sub.student_answer,
        "is_correct": is_correct,
        "confidence": sub.confidence,
        "misconception_id": detected_misconception,
        "misconception_name": MISCONCEPTIONS[detected_misconception]["name"] if detected_misconception in MISCONCEPTIONS else None,
        "error_taxonomy": error_taxonomy.value,
        "response_time_seconds": sub.response_time_seconds,
        "idempotency_key": sub.idempotency_key,
        "created_at": now_dt.isoformat(),
        "is_reassessment": sub.is_reassessment,
        "is_follow_up": getattr(question, "is_follow_up", False),
        "parent_question_id": getattr(question, "parent_question_id", None)
    })

    return AnswerEvaluation(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        concept_id=question.concept_id,
        detected_misconception=detected_misconception,
        misconception_explanation=misconception_explanation,
        error_taxonomy=error_taxonomy,
        ai_feedback=ai_feedback,
        worked_solution=question.worked_solution,
        previous_mastery=prior_p,
        updated_mastery=p_projected,
        mastery_change=mastery_change,
        is_mastered=is_mastered,
        response_time_seconds=sub.response_time_seconds,
        time_signal=time_signal,
        confidence_insight=confidence_insight,
        needs_follow_up=needs_follow_up,
        follow_up_question=follow_up_student_view
    )

# ----------------- Feature B: Spaced Revision Endpoints -----------------
@router.get("/revision/schedule")
def get_revision_schedule(student_id: Optional[str] = "student_alex"):
    user_recs = repo.mastery_records.get(student_id, {})
    if not user_recs:
        return {
            "due_revisions": [],
            "upcoming_revisions": [],
            "mastered_count": 0,
            "message": "No practice records found yet. Complete a quiz to activate spaced revision!"
        }

    practice_records = []
    for cid, m in user_recs.items():
        concept = repo.concepts.get(cid)
        recent_errs = sum(
            1 for a in repo.attempts
            if a.get("student_id") == student_id and a.get("concept_id") == cid and not a.get("is_correct", False)
        )
        practice_records.append({
            "concept_id": cid,
            "concept_title": concept.name if concept else cid,
            "mastery_probability": m.p_mastery,
            "last_practiced_at": m.last_updated,
            "recent_error_count": recent_errs,
            "repetitions_count": m.practice_count
        })

    return spaced_revision_service.compute_schedules(student_id, practice_records)

@router.post("/revision/{concept_id}/complete")
def complete_revision(concept_id: str, student_id: Optional[str] = "student_alex"):
    concept = repo.concepts.get(concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    m = repo.get_or_create_student_mastery(student_id, concept_id)
    next_interval = spaced_revision_service.calculate_next_interval(
        m.practice_count + 1,
        m.p_mastery,
        True
    )
    now_dt = datetime.utcnow()
    next_due = now_dt + timedelta(days=next_interval)
    rationale = spaced_revision_service.generate_rationale(concept.name, 0, m.p_mastery, False, 0)

    schedule = RevisionSchedule(
        id=f"rev_{student_id}_{concept_id}",
        student_id=student_id,
        concept_id=concept_id,
        concept_title=concept.name,
        last_practiced_at=now_dt.isoformat(),
        next_review_due_at=next_due.isoformat(),
        interval_days=next_interval,
        repetitions_count=m.practice_count + 1,
        mastery_probability=m.p_mastery,
        status=RevisionStatus.SCHEDULED,
        recommendation_rationale=rationale
    )

    if student_id not in repo.revision_schedules:
        repo.revision_schedules[student_id] = {}
    repo.revision_schedules[student_id][concept_id] = schedule

    return {
        "message": f"Spaced revision for {concept.name} recorded successfully.",
        "next_review_due_at": next_due.isoformat(),
        "interval_days": next_interval
    }

# ----------------- Feature C: Explainable Recommendations Endpoint -----------------
@router.get("/recommendations/next", response_model=Recommendation)
def get_explainable_recommendation(
    concept_id: Optional[str] = Query(None),
    target_concept_id: Optional[str] = Query(None),
    student_id: Optional[str] = "student_alex"
):
    # Support both concept_id and target_concept_id query params seamlessly
    active_cid = target_concept_id or concept_id or "fraction_addition_unlike"
    target_concept = repo.concepts.get(active_cid)
    if not target_concept:
        target_concept = list(repo.concepts.values())[0]
        active_cid = target_concept.id

    student_records = repo.mastery_records.get(student_id, {})
    mastery_map = {cid: r.p_mastery for cid, r in student_records.items()}
    attempts_map = {cid: r.practice_count for cid, r in student_records.items()}

    # Check due spaced revisions
    sched_info = get_revision_schedule(student_id)
    due_revs = sched_info.get("due_revisions", [])

    eligible_questions = content_review_service.filter_student_eligible_questions(list(repo.questions.values()))
    raw_qs = [{"id": q.id, "concept_id": q.concept_id, "difficulty": q.difficulty} for q in eligible_questions]

    student_attempts = [a for a in repo.attempts if a.get("student_id") == student_id]

    return recommendation_service.generate_recommendation(
        student_id=student_id,
        target_concept_id=active_cid,
        target_concept_name=target_concept.name,
        concepts_map=repo.concepts,
        student_mastery_map=mastery_map,
        student_attempts_count_map=attempts_map,
        recent_attempts=student_attempts,
        due_revisions=due_revs,
        available_questions=raw_qs
    )

# ----------------- Feature D: Teacher Content Review Quality Gate -----------------
@router.get("/teacher/content-reviews", response_model=List[Question])
def get_content_reviews(status: Optional[str] = None, source: Optional[str] = None):
    all_qs = list(repo.questions.values())
    filtered = all_qs

    if status:
        filtered = [q for q in filtered if q.review_status.value == status]
    if source:
        filtered = [q for q in filtered if q.source == source]

    return filtered

@router.post("/teacher/content-reviews/{question_id}/action")
def process_content_review(
    question_id: str,
    action: str = Body(..., embed=True),
    reason: Optional[str] = Body(None, embed=True),
    teacher_id: Optional[str] = Body("teacher_sarah", embed=True)
):
    question = repo.questions.get(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    user = repo.users.get(teacher_id, {"name": "Teacher", "role": "teacher"})
    res = content_review_service.process_review_action(
        question=question,
        reviewer_id=teacher_id,
        reviewer_name=user.get("name", "Teacher"),
        reviewer_role=user.get("role", "teacher"),
        action=action,
        reason=reason
    )

    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])

    repo.content_reviews.append(res["history_entry"])
    return {
        "message": f"Question review status updated to {res['new_status'].value}.",
        "result": res
    }

# ----------------- Feature F: Student Feedback and Content Reporting -----------------
@router.post("/reports", status_code=201)
def submit_content_report(
    content_id: str = Body(..., embed=True),
    content_type: str = Body("question", embed=True),
    content_version: int = Body(1, embed=True),
    reason: ContentReportReason = Body(..., embed=True),
    comment: str = Body("", embed=True),
    student_id: Optional[str] = Body("student_alex", embed=True)
):
    # Graceful deduplication: check if already reported for same reason by same student
    for existing in repo.content_reports:
        if (
            existing.student_id == student_id
            and existing.content_id == content_id
            and existing.status == ContentReportStatus.PENDING
            and existing.reason == reason
        ):
            return {
                "message": "Your report for this question has already been submitted and is in the teacher review queue.",
                "report_id": existing.id
            }

    student_user = repo.users.get(student_id, {"name": "Student"})
    report_id = f"rep_{int(datetime.utcnow().timestamp())}_{len(repo.content_reports)+1}"
    new_report = ContentReport(
        id=report_id,
        student_id=student_id,
        student_name=student_user.get("name", "Student"),
        content_id=content_id,
        content_type=content_type,
        content_version=content_version,
        reason=reason,
        comment=comment.strip(),
        status=ContentReportStatus.PENDING,
        created_at=datetime.utcnow().isoformat()
    )

    repo.content_reports.append(new_report)
    return {
        "message": "Thank you for your feedback! Our curriculum teachers will review this issue.",
        "report_id": report_id
    }

@router.get("/teacher/reports", response_model=List[Dict[str, Any]])
def get_teacher_reports():
    # Mask internal student IDs to preserve student privacy (Spec §18.6 & §9)
    sanitized = []
    for r in repo.content_reports:
        sanitized.append({
            "id": r.id,
            "student_name": r.student_name,
            "content_id": r.content_id,
            "content_type": r.content_type,
            "content_version": r.content_version,
            "reason": r.reason.value,
            "comment": r.comment,
            "status": r.status.value,
            "created_at": r.created_at,
            "resolved_at": r.resolved_at,
            "resolution_notes": r.resolution_notes
        })
    return sanitized

@router.patch("/teacher/reports/{report_id}/resolve")
def resolve_teacher_report(
    report_id: str,
    status: ContentReportStatus = Body(..., embed=True),
    resolution_notes: Optional[str] = Body(None, embed=True),
    teacher_id: Optional[str] = Body("teacher_sarah", embed=True)
):
    target = next((r for r in repo.content_reports if r.id == report_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Report not found")

    target.status = status
    target.resolved_at = datetime.utcnow().isoformat()
    target.resolved_by = teacher_id
    target.resolution_notes = resolution_notes

    return {
        "message": f"Report marked as {status.value}.",
        "report_id": report_id,
        "status": status.value
    }

# ----------------- Feature A: Student Meta-Cognitive Calibration -----------------
@router.get("/analytics/student/confidence")
def get_student_confidence_summary(student_id: Optional[str] = "student_alex"):
    student_attempts = [a for a in repo.attempts if a.get("student_id") == student_id]
    return confidence_service.summarize_patterns(student_attempts)

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
    student_atts = [
        a for a in repo.attempts if a["student_id"] == student_id and a["concept_id"] == concept_id
    ]

    pre_scores = [1.0 if a["is_correct"] else 0.0 for a in student_atts if not a.get("is_reassessment", False)]
    post_scores = [1.0 if a["is_correct"] else 0.0 for a in student_atts if a.get("is_reassessment", False)]

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

# Spec §18.6: Fair Teacher Support Signals Endpoint
@router.get("/analytics/students", response_model=List[StudentSummary])
def get_students_summary():
    students_list = []
    for sid, u in repo.users.items():
        if u["role"] == "student":
            recs = repo.mastery_records.get(sid, {})
            avg_m = round(sum(r.p_mastery for r in recs.values()) / max(1, len(recs)), 2)
            gaps = [r.concept_id for r in recs.values() if r.p_mastery < 0.60]

            student_attempts = [a for a in repo.attempts if a.get("student_id") == sid]
            attempts_count = len(student_attempts)
            recent_errs = sum(1 for a in student_attempts[-5:] if not a.get("is_correct", False))

            # Fair Support Signal transparent criteria (Spec §18.6)
            if attempts_count < 2:
                signal = SupportSignal.INSUFFICIENT_DATA
                evidence_summary = f"Only {attempts_count} attempt(s) recorded; data is insufficient for support determination."
                risk_compat = "Insufficient Data"
            elif avg_m < 0.50 and recent_errs >= 2 and attempts_count >= 3:
                signal = SupportSignal.NEEDS_SUPPORT
                evidence_summary = f"Mastery estimated at {int(avg_m*100)}% with {recent_errs} recent errors across {attempts_count} practice attempts."
                risk_compat = "Needs Support"
            elif avg_m >= 0.75:
                signal = SupportSignal.ON_TRACK
                evidence_summary = f"Consistently high mastery ({int(avg_m*100)}%) across target mathematics concepts."
                risk_compat = "On Track"
            else:
                signal = SupportSignal.MONITORING
                evidence_summary = f"Mastery estimated at {int(avg_m*100)}%; regular monitoring recommended."
                risk_compat = "Monitoring"

            students_list.append(StudentSummary(
                student_id=sid,
                name=u["name"],
                grade=u.get("grade", "8th Grade"),
                average_mastery=avg_m,
                support_signal=signal,
                risk_level=risk_compat,
                evidence_summary=evidence_summary,
                attempt_count=attempts_count,
                last_active=student_attempts[-1].get("created_at") if student_attempts else None,
                active_gaps_count=len(gaps),
                active_gaps=gaps
            ))
    return students_list

# ----------------- Spec §18.5 & §21: Knowledge Graph Integrity & Cycle Detection -----------------
@router.get("/graph/validate")
def validate_knowledge_graph():
    """
    Validates prerequisite graph structure and checks for circular dependencies.
    """
    has_cycles, cycles = graph_service.detect_cycles(list(repo.concepts.values()))
    topological_order = [] if has_cycles else graph_service.topological_sort(list(repo.concepts.values()))
    return {
        "is_valid": not has_cycles,
        "has_cycles": has_cycles,
        "cycles": cycles,
        "topological_order": topological_order,
        "total_concepts": len(repo.concepts)
    }

# ----------------- Spec §18.3: BKT Model Configuration & Parameter Versioning -----------------
@router.get("/model/bkt/config", response_model=BKTModelVersion)
def get_bkt_config():
    """
    Exposes documented BKT formulas, parameter versions, and Dirichlet defaults.
    """
    return BKTModelVersion()


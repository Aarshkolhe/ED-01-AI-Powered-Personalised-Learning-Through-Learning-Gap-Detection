import pytest
from app.services.bkt import BKTEngine
from app.services.step_detector import StepDetector
from app.services.recovery_engine import RecoveryEngine
from app.services.ai_service import AIService
from app.data.curriculum import CONCEPTS, SEED_QUESTIONS

def test_bkt_correct_update():
    engine = BKTEngine(p_init=0.20, p_transit=0.15, p_guess=0.20, p_slip=0.10)
    prior = 0.20
    p_obs, p_next = engine.update_mastery(prior, is_correct=True)
    # With correct observation, posterior and next mastery must increase
    assert p_obs > prior
    assert p_next > p_obs
    assert 0.0 < p_next < 1.0

def test_bkt_incorrect_update():
    engine = BKTEngine(p_init=0.50, p_transit=0.15, p_guess=0.20, p_slip=0.10)
    prior = 0.50
    p_obs, p_next = engine.update_mastery(prior, is_correct=False)
    # With incorrect observation, p_obs must decrease below prior
    assert p_obs < prior
    assert 0.0 < p_next < 1.0

def test_step_detector_identifies_sign_error():
    detector = StepDetector()
    problem = "2x + 6 = 20"
    correct = "7"
    erroneous_steps = ["2x = 26", "x = 13"]
    analysis = detector.analyze_steps(problem, correct, erroneous_steps)
    
    assert analysis.has_error is True
    assert analysis.first_error_step_index == 0
    assert analysis.error_type == "sign_inversion_error"
    assert "2x = 20 - 6" in analysis.corrected_step

def test_step_detector_valid_solution():
    detector = StepDetector()
    problem = "2x + 6 = 20"
    correct = "7"
    valid_steps = ["2x = 14", "x = 7"]
    analysis = detector.analyze_steps(problem, correct, valid_steps)
    
    assert analysis.has_error is False
    assert analysis.first_error_step_index is None

def test_recovery_engine_path_generation():
    engine = RecoveryEngine()
    student_mastery = {
        "fractions_intro": 0.85,
        "equivalent_fractions": 0.30,
        "fraction_addition_like": 0.85
    }
    # Focal concept: fraction_addition_unlike (prereqs: equivalent_fractions, fraction_addition_like)
    plan = engine.generate_recovery_path("student_test", "fraction_addition_unlike", student_mastery)
    
    assert plan.focal_concept_id == "fraction_addition_unlike"
    # equivalent_fractions has mastery 0.30 < 0.70, so it must be flagged in active gaps
    assert "equivalent_fractions" in plan.active_gaps

def test_recovery_score_calculation():
    engine = RecoveryEngine()
    # Pre-test 0% correct, Post-test 100% correct
    report = engine.calculate_recovery_score("student_test", "fraction_addition_unlike", [0.0], [1.0])
    assert report.pre_score == 0.0
    assert report.post_score == 1.0
    assert report.score_delta == 1.0
    assert report.recovery_percentage > 50.0
    assert "Significant Recovery" in report.status

def test_question_generator_verification():
    ai = AIService()
    q = ai.generate_targeted_question("fraction_addition_like", "add_denominators")
    assert q is not None
    assert len(q.options) >= 2
    assert q.correct_answer in [opt.text for opt in q.options]

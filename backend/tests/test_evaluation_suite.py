import pytest
from app.evaluation.evaluator import EvaluationRunner

def test_evaluation_suite_runs_and_passes():
    runner = EvaluationRunner()
    result = runner.run_all(verbose=False)
    assert result["all_passed"] is True, "Evaluation benchmark failed regressions"

def test_evaluation_misconception_accuracy_threshold():
    runner = EvaluationRunner()
    phase1 = runner.evaluate_misconception_detection(verbose=False)
    assert phase1["passed"] is True
    assert phase1["overall_accuracy"] >= 0.85
    assert phase1["sample_size"] == 15
    assert "concept_misunderstanding" in phase1["category_metrics"]
    assert "arithmetic_or_sign_error" in phase1["category_metrics"]

def test_evaluation_question_validation_and_duplicate_detector():
    runner = EvaluationRunner()
    phase2 = runner.evaluate_question_validation(verbose=False)
    assert phase2["passed"] is True
    assert phase2["total_questions_evaluated"] == 5

def test_evaluation_bkt_monotonicity_and_confidence_isolation():
    runner = EvaluationRunner()
    phase3 = runner.evaluate_bkt_engine(verbose=False)
    assert phase3["passed"] is True

def test_evaluation_recommendation_traceability():
    runner = EvaluationRunner()
    phase4 = runner.evaluate_recommendation_engine(verbose=False)
    assert phase4["passed"] is True
    assert phase4["test_cases_count"] >= 4

#!/usr/bin/env python
import sys
import os

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.evaluation.evaluator import EvaluationRunner

if __name__ == "__main__":
    runner = EvaluationRunner()
    result = runner.run_all(verbose=True)
    sys.exit(0 if result["all_passed"] else 1)

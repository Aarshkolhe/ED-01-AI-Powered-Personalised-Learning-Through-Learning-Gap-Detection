"""
Bayesian Knowledge Tracing (BKT) Core Engine.

Standard BKT model maintains the posterior probability P(L_t) that a student
has mastered a given concept given their response sequence.

Parameters:
- P(L_0): Initial mastery probability
- P(T): Transition probability (learning rate: P(L_{t+1}=1 | L_t=0))
- P(G): Guess probability (P(Correct | L_t=0))
- P(S): Slip probability (P(Incorrect | L_t=1))

Update Formulas:
1. When observation is CORRECT (Obs=1):
   P(L_t | Obs=1) = [ P(L_t) * (1 - S) ] / [ P(L_t) * (1 - S) + (1 - P(L_t)) * G ]

2. When observation is INCORRECT (Obs=0):
   P(L_t | Obs=0) = [ P(L_t) * S ] / [ P(L_t) * S + (1 - P(L_t)) * (1 - G) ]

3. Transition to next opportunity:
   P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
"""

from typing import Tuple

class BKTEngine:
    def __init__(self, p_init: float = 0.20, p_transit: float = 0.15, p_guess: float = 0.20, p_slip: float = 0.10):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update_mastery(self, prior_p: float, is_correct: bool) -> Tuple[float, float]:
        """
        Calculates updated mastery probability.
        Returns:
            Tuple of (posterior_given_obs, projected_next_mastery)
        """
        # Ensure prior is bounded safely to prevent division by zero or degenerate values
        p_prev = max(0.001, min(0.999, prior_p))

        if is_correct:
            # Observation is correct
            numerator = p_prev * (1.0 - self.p_slip)
            denominator = numerator + (1.0 - p_prev) * self.p_guess
            p_obs = numerator / denominator if denominator > 0 else p_prev
        else:
            # Observation is incorrect
            numerator = p_prev * self.p_slip
            denominator = numerator + (1.0 - p_prev) * (1.0 - self.p_guess)
            p_obs = numerator / denominator if denominator > 0 else p_prev

        # Transition for next opportunity
        p_next = p_obs + (1.0 - p_obs) * self.p_transit
        p_final = max(0.01, min(0.99, round(p_next, 4)))
        p_obs_rounded = round(p_obs, 4)

        return p_obs_rounded, p_final

bkt_engine = BKTEngine()

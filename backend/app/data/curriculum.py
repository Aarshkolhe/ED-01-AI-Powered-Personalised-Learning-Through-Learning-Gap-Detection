"""
Curriculum Seed Data & Static Knowledge Graph for Mathematics.
Topics:
1. Fractions Fundamentals (fractions_intro)
2. Equivalent Fractions (equivalent_fractions)
3. Adding Fractions with Common Denominators (fraction_addition_like)
4. Adding Fractions with Unlike Denominators (fraction_addition_unlike)
5. Algebraic Expressions & Like Terms (algebra_expressions)
6. Single-Step Linear Equations (linear_equations_1step)
7. Two-Step Linear Equations (linear_equations_2step)
"""

from app.models.schemas import Concept, ConceptDifficulty, Question, QuestionOption
from typing import List, Dict

CONCEPTS: List[Concept] = [
    Concept(
        id="fractions_intro",
        name="Understanding Fractions",
        description="Parts of a whole, numerators, and denominators.",
        difficulty=ConceptDifficulty.BEGINNER,
        order=1,
        prerequisites=[],
        category="Fractions & Arithmetic",
        mastery_threshold=0.80
    ),
    Concept(
        id="equivalent_fractions",
        name="Equivalent Fractions",
        description="Fractions representing the same value by scaling numerator and denominator.",
        difficulty=ConceptDifficulty.BEGINNER,
        order=2,
        prerequisites=["fractions_intro"],
        category="Fractions & Arithmetic",
        mastery_threshold=0.80
    ),
    Concept(
        id="fraction_addition_like",
        name="Adding Fractions (Like Denominators)",
        description="Adding numerators while keeping the common denominator constant.",
        difficulty=ConceptDifficulty.BEGINNER,
        order=3,
        prerequisites=["fractions_intro"],
        category="Fractions & Arithmetic",
        mastery_threshold=0.85
    ),
    Concept(
        id="fraction_addition_unlike",
        name="Adding Fractions (Unlike Denominators)",
        description="Finding least common denominators (LCD) before summing numerators.",
        difficulty=ConceptDifficulty.INTERMEDIATE,
        order=4,
        prerequisites=["equivalent_fractions", "fraction_addition_like"],
        category="Fractions & Arithmetic",
        mastery_threshold=0.85
    ),
    Concept(
        id="algebra_expressions",
        name="Algebraic Expressions & Like Terms",
        description="Variables, coefficients, and combining like algebraic terms.",
        difficulty=ConceptDifficulty.INTERMEDIATE,
        order=5,
        prerequisites=[],
        category="Algebra",
        mastery_threshold=0.80
    ),
    Concept(
        id="linear_equations_1step",
        name="One-Step Linear Equations",
        description="Isolating variables using inverse operations (addition/subtraction/multiplication/division).",
        difficulty=ConceptDifficulty.INTERMEDIATE,
        order=6,
        prerequisites=["algebra_expressions"],
        category="Algebra",
        mastery_threshold=0.85
    ),
    Concept(
        id="linear_equations_2step",
        name="Two-Step Linear Equations",
        description="Solving equations requiring two inverse operations (e.g., ax + b = c).",
        difficulty=ConceptDifficulty.ADVANCED,
        order=7,
        prerequisites=["linear_equations_1step"],
        category="Algebra",
        mastery_threshold=0.85
    ),
]

MISCONCEPTIONS: Dict[str, Dict[str, str]] = {
    "add_denominators": {
        "name": "Adding Across Denominators",
        "description": "Student adds both numerators and denominators straight across: a/b + c/d = (a+c)/(b+d).",
        "remediation_hint": "Remember: the denominator names the size of each slice! When slices are the same size, you only count how many you have by adding the top numerators."
    },
    "cross_multiply_in_addition": {
        "name": "Cross-Multiplication in Addition",
        "description": "Student mistakenly cross-multiplies when adding fractions instead of finding a common denominator.",
        "remediation_hint": "Cross-multiplication is used for proportions, not for adding fractions. Convert both fractions to equivalent fractions with a shared denominator first."
    },
    "sign_flip_omission": {
        "name": "Missing Sign Reversal in Equation Isolation",
        "description": "When moving terms across the equals sign, the student forgets to apply the inverse operation (e.g. treating 2x + 5 = 15 as 2x = 15 + 5).",
        "remediation_hint": "Whatever operation is being done to the variable, apply the exact opposite inverse operation to both sides of the balance scale."
    },
    "unlike_terms_merging": {
        "name": "Merging Unlike Algebraic Terms",
        "description": "Student treats 3x + 4 as 7x or 7, conflating constants with variable coefficients.",
        "remediation_hint": "Apples and numbers can't be added into one pile! Terms with variables can only combine with matching terms that have the exact same variable."
    },
    "divide_only_one_term": {
        "name": "Partial Coefficient Division",
        "description": "In 2x + 4 = 10, student divides only the left constant without dividing all terms or isolating first.",
        "remediation_hint": "Always undo addition or subtraction first to leave the variable term by itself, then divide."
    }
}

SEED_QUESTIONS: List[Question] = [
    # 1. fraction_addition_like - baseline
    Question(
        id="q_frac_like_01",
        concept_id="fraction_addition_like",
        prompt="What is 1/5 + 2/5?",
        prompt_hi="1/5 + 2/5 का मान क्या होगा?",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_1",
                text="3/5",
                text_hi="3/5",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_2",
                text="3/10",
                text_hi="3/10",
                misconception_id="add_denominators",
                misconception_explanation="You added both the top (1+2=3) and the bottom (5+5=10). When denominators are already equal, the denominator stays the same!",
                misconception_explanation_hi="आपने अंश और हर दोनों को जोड़ दिया (5+5=10)। समान हर होने पर हर नहीं बदलता!"
            ),
            QuestionOption(
                id="opt_3",
                text="2/5",
                text_hi="2/5",
                misconception_id=None,
                misconception_explanation="You multiplied the numerators (1*2) instead of adding them."
            ),
            QuestionOption(
                id="opt_4",
                text="3/25",
                text_hi="3/25",
                misconception_id="add_denominators",
                misconception_explanation="You multiplied denominators instead of keeping the common denominator."
            )
        ],
        correct_answer="3/5",
        worked_solution=[
            "Step 1: Check the denominators. Both are 5, so they are like fractions.",
            "Step 2: Add only the numerators: 1 + 2 = 3.",
            "Step 3: Keep the denominator 5: result is 3/5."
        ],
        worked_solution_hi=[
            "चरण 1: हरों की जाँच करें। दोनों 5 हैं, अतः ये समान भिन्न हैं।",
            "चरण 2: केवल अंशों को जोड़ें: 1 + 2 = 3।",
            "चरण 3: हर 5 को वैसा ही रखें: उत्तर 3/5 है।"
        ],
        difficulty=0.2
    ),

    # 2. fraction_addition_unlike - baseline
    Question(
        id="q_frac_unlike_01",
        concept_id="fraction_addition_unlike",
        prompt="Calculate: 1/2 + 1/3",
        prompt_hi="हल करें: 1/2 + 1/3",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_1",
                text="2/5",
                text_hi="2/5",
                misconception_id="add_denominators",
                misconception_explanation="Classic trap: you added 1+1=2 and 2+3=5. You cannot add fractions with different denominators directly!",
                misconception_explanation_hi="आपने अंश और हर सीधे जोड़ दिए (1+1=2 और 2+3=5)। असमान हरों को सीधे नहीं जोड़ा जा सकता!"
            ),
            QuestionOption(
                id="opt_2",
                text="5/6",
                text_hi="5/6",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_3",
                text="1/6",
                text_hi="1/6",
                misconception_id="cross_multiply_in_addition",
                misconception_explanation="You multiplied the denominators and numerators without finding the sum."
            ),
            QuestionOption(
                id="opt_4",
                text="2/6",
                text_hi="2/6",
                misconception_id=None,
                misconception_explanation="You found the common denominator 6, but only added the top 1+1 without converting the numerators."
            )
        ],
        correct_answer="5/6",
        worked_solution=[
            "Step 1: Find LCD of 2 and 3, which is 6.",
            "Step 2: Convert 1/2 to equivalent fraction with denominator 6: (1*3)/(2*3) = 3/6.",
            "Step 3: Convert 1/3 to equivalent fraction with denominator 6: (1*2)/(3*2) = 2/6.",
            "Step 4: Add: 3/6 + 2/6 = 5/6."
        ],
        difficulty=0.6
    ),

    # 3. algebra_expressions - baseline
    Question(
        id="q_alg_expr_01",
        concept_id="algebra_expressions",
        prompt="Simplify the algebraic expression: 3x + 5 + 4x - 2",
        prompt_hi="व्यंजक को सरल करें: 3x + 5 + 4x - 2",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_1",
                text="7x + 3",
                text_hi="7x + 3",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_2",
                text="10x",
                text_hi="10x",
                misconception_id="unlike_terms_merging",
                misconception_explanation="You combined numbers and x terms together: 3x + 4x = 7x, and 5 - 2 = 3, then incorrectly added 7x + 3 = 10x. Variable terms and constants cannot be merged!",
                misconception_explanation_hi="आपने चर पद और अचर संख्या को आपस में जोड़ दिया (7x + 3 = 10x)। इन्हें एक साथ नहीं मिलाया जा सकता!"
            ),
            QuestionOption(
                id="opt_3",
                text="7x + 7",
                text_hi="7x + 7",
                misconception_id="sign_flip_omission",
                misconception_explanation="You added 5 + 2 instead of subtracting 5 - 2."
            ),
            QuestionOption(
                id="opt_4",
                text="12x + 3",
                text_hi="12x + 3",
                misconception_id=None,
                misconception_explanation="You multiplied the coefficients (3 * 4) instead of adding like terms."
            )
        ],
        correct_answer="7x + 3",
        worked_solution=[
            "Step 1: Group like terms together: (3x + 4x) + (5 - 2).",
            "Step 2: Combine variable terms: 3x + 4x = 7x.",
            "Step 3: Combine constant terms: 5 - 2 = 3.",
            "Step 4: Final combined expression: 7x + 3."
        ],
        difficulty=0.4
    ),

    # 4. linear_equations_1step - baseline
    Question(
        id="q_lin_1step_01",
        concept_id="linear_equations_1step",
        prompt="Solve for x: x + 8 = 15",
        prompt_hi="x का मान ज्ञात करें: x + 8 = 15",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_1",
                text="7",
                text_hi="7",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_2",
                text="23",
                text_hi="23",
                misconception_id="sign_flip_omission",
                misconception_explanation="You added 8 to both sides (15 + 8 = 23). The inverse of addition (+8) is subtraction (-8)!",
                misconception_explanation_hi="आपने 15 में 8 जोड़ दिया (15 + 8 = 23)। जोड़ (+8) का उलटा घटाना (-8) होता है!"
            ),
            QuestionOption(
                id="opt_3",
                text="120",
                text_hi="120",
                misconception_id=None,
                misconception_explanation="You multiplied 15 * 8 instead of subtracting."
            ),
            QuestionOption(
                id="opt_4",
                text="-7",
                text_hi="-7",
                misconception_id=None,
                misconception_explanation="Sign error during subtraction (8 - 15 instead of 15 - 8)."
            )
        ],
        correct_answer="7",
        worked_solution=[
            "Step 1: Subtract 8 from both sides: x + 8 - 8 = 15 - 8.",
            "Step 2: Evaluate the right side: 15 - 8 = 7.",
            "Step 3: x = 7."
        ],
        difficulty=0.3
    ),

    # 5. linear_equations_2step - baseline
    Question(
        id="q_lin_2step_01",
        concept_id="linear_equations_2step",
        prompt="Solve for x: 2x + 6 = 20",
        prompt_hi="x का मान ज्ञात करें: 2x + 6 = 20",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_1",
                text="7",
                text_hi="7",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_2",
                text="13",
                text_hi="13",
                misconception_id="sign_flip_omission",
                misconception_explanation="You added 6 to 20 instead of subtracting: 20 + 6 = 26, then 26 / 2 = 13. Remember to invert +6 into -6!",
                misconception_explanation_hi="आपने 20 में 6 जोड़ दिया जबकि घटाना चाहिए था: 20 + 6 = 26, 26/2=13।"
            ),
            QuestionOption(
                id="opt_3",
                text="10",
                text_hi="10",
                misconception_id="divide_only_one_term",
                misconception_explanation="You divided 20 by 2 first without subtracting 6.",
                misconception_explanation_hi="आपने 6 घटाए बिना ही सीधे 20 को 2 से भाग दे दिया।"
            ),
            QuestionOption(
                id="opt_4",
                text="28",
                text_hi="28",
                misconception_id=None,
                misconception_explanation="You added and multiplied instead of using inverse operations."
            )
        ],
        correct_answer="7",
        worked_solution=[
            "Step 1: Subtract 6 from both sides: 2x = 20 - 6 = 14.",
            "Step 2: Divide both sides by 2: x = 14 / 2.",
            "Step 3: x = 7."
        ],
        difficulty=0.7
    ),

    # Reassessment / Post-test fresh questions (Targeting the same concepts)
    Question(
        id="q_frac_unlike_post_01",
        concept_id="fraction_addition_unlike",
        prompt="Post-Test Reassessment: Calculate 1/4 + 2/3",
        prompt_hi="पुनर्मूल्यांकन: 1/4 + 2/3 का मान निकालें",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_post_1",
                text="11/12",
                text_hi="11/12",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_post_2",
                text="3/7",
                text_hi="3/7",
                misconception_id="add_denominators",
                misconception_explanation="You still added numerators 1+2=3 and denominators 4+3=7. Remember you must convert to LCD 12 first!",
                misconception_explanation_hi="आपने अंश और हर सीधे जोड़ दिए (3/7)। आपको पहले लघुत्तम समापवर्त्य (12) निकालना होगा!"
            ),
            QuestionOption(
                id="opt_post_3",
                text="3/12",
                text_hi="3/12",
                misconception_id=None,
                misconception_explanation="You kept the common denominator 12 but did not scale the numerators."
            ),
            QuestionOption(
                id="opt_post_4",
                text="8/12",
                text_hi="8/12",
                misconception_id=None
            )
        ],
        correct_answer="11/12",
        worked_solution=[
            "Step 1: Common denominator for 4 and 3 is 12.",
            "Step 2: 1/4 = 3/12.",
            "Step 3: 2/3 = 8/12.",
            "Step 4: 3/12 + 8/12 = 11/12."
        ],
        difficulty=0.65
    ),

    Question(
        id="q_lin_2step_post_01",
        concept_id="linear_equations_2step",
        prompt="Post-Test Reassessment: Solve for x: 3x - 4 = 11",
        prompt_hi="पुनर्मूल्यांकन: x का मान ज्ञात करें: 3x - 4 = 11",
        question_type="multiple_choice",
        options=[
            QuestionOption(
                id="opt_post_1",
                text="5",
                text_hi="5",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_post_2",
                text="7/3",
                text_hi="7/3",
                misconception_id="sign_flip_omission",
                misconception_explanation="You subtracted 4 from 11 (11 - 4 = 7). The inverse of -4 is +4! (11 + 4 = 15).",
                misconception_explanation_hi="आपने 11 में से 4 घटा दिया। ऋण (-4) का उलटा धन (+4) होता है!"
            ),
            QuestionOption(
                id="opt_post_3",
                text="2.33",
                text_hi="2.33",
                misconception_id=None
            ),
            QuestionOption(
                id="opt_post_4",
                text="15",
                text_hi="15",
                misconception_id=None,
                misconception_explanation="You added 4 to get 15, but forgot to divide by the coefficient 3."
            )
        ],
        correct_answer="5",
        worked_solution=[
            "Step 1: Add 4 to both sides: 3x = 11 + 4 = 15.",
            "Step 2: Divide both sides by 3: x = 15 / 3 = 5."
        ],
        difficulty=0.7
    )
]

"""
scoring_service.py
------------------
Experience Transfer Score.

The formula is deliberately simple and fully transparent so the team can
explain it on stage and a judge can recompute it by hand:

    accuracy   = correct_answers / total_questions * 100
    first_try  = first_attempt_correct / total_questions * 100   (if supplied)
    score      = round(accuracy)                                 (0-100)

`improvement` compares this attempt with a baseline. If the caller supplies a
real previous score, the improvement is real. If not, we return null and say
so -- we do not manufacture a "before" number to make a chart look good.
"""

from __future__ import annotations

from typing import Optional

BANDS = [
    (90, "Expert-aligned", "Your choices matched the senior engineer's reasoning almost every time."),
    (75, "Strong", "You reasoned like an experienced engineer on most steps."),
    (60, "Developing", "Solid instincts, with a few steps where the senior path differed."),
    (40, "Emerging", "You are building the pattern recognition. Review the senior reasoning for each step."),
    (0, "Early", "Work through the senior reasoning and the linked experiences, then retry the scenario."),
]


def _band(score: float) -> tuple[str, str]:
    for threshold, label, description in BANDS:
        if score >= threshold:
            return label, description
    return BANDS[-1][1], BANDS[-1][2]


def calculate_score(
    correct_answers: int,
    total_questions: int,
    scenario_id: Optional[str] = None,
    first_attempt_correct: Optional[int] = None,
    previous_score: Optional[float] = None,
    time_taken_seconds: Optional[int] = None,
) -> dict:
    """
    Compute an Experience Transfer Score.

    Raises ValueError for inputs that cannot produce a meaningful score; the
    API layer converts that into a clean 400 response.
    """
    if total_questions <= 0:
        raise ValueError("total_questions must be greater than zero.")
    if correct_answers < 0:
        raise ValueError("correct_answers cannot be negative.")
    if correct_answers > total_questions:
        raise ValueError("correct_answers cannot exceed total_questions.")
    if first_attempt_correct is not None:
        if first_attempt_correct < 0 or first_attempt_correct > total_questions:
            raise ValueError("first_attempt_correct must be between 0 and total_questions.")

    accuracy = correct_answers / total_questions * 100
    score = round(accuracy)
    label, description = _band(score)

    if previous_score is None:
        improvement = None
        improvement_note = (
            "No previous attempt was supplied, so no improvement is reported. "
            "This prototype does not store user history, and no simulated "
            "'before' value is generated."
        )
    else:
        improvement = round(score - float(previous_score), 2)
        improvement_note = (
            f"Change measured against the previous score of {previous_score} "
            "supplied by the client."
        )

    metrics = {
        "accuracy_percent": round(accuracy, 2),
        "correct_answers": correct_answers,
        "incorrect_answers": total_questions - correct_answers,
        "total_questions": total_questions,
    }
    if first_attempt_correct is not None:
        metrics["first_attempt_accuracy_percent"] = round(
            first_attempt_correct / total_questions * 100, 2
        )
    if time_taken_seconds is not None and time_taken_seconds >= 0:
        metrics["time_taken_seconds"] = time_taken_seconds
        metrics["avg_seconds_per_question"] = round(time_taken_seconds / total_questions, 2)

    return {
        "scenario_id": scenario_id,
        "score": score,
        "band": label,
        "band_description": description,
        "improvement": improvement,
        "improvement_note": improvement_note,
        "metrics": metrics,
        "formula": "score = round(correct_answers / total_questions * 100)",
        "disclaimer": (
            "This score measures agreement with the reviewed senior reasoning in this "
            "scenario set. It is not a validated measure of real-world engineering "
            "competence."
        ),
    }

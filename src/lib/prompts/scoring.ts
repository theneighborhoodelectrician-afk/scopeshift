export const scoringPrompt = {
  version: "2.1.0",
  content: `Evaluate the technician's performance from the full scenario transcript.

Return JSON only with integer scores from 0 to 10 for:
- rapport_score
- discovery_score
- risk_explanation_score
- education_score
- options_score
- commitment_score
- scope_expansion_score

Scoring rules:
- Reward rapport, discovery depth, homeowner-centered education, clear risk framing, three-option structure, and a commitment question.
- Reward symptom-to-system thinking: the technician should connect the visible issue to a larger safety, reliability, capacity, or resale conversation when justified.
- Reward while-we-are-here framing when it feels earned and professional.
- Reward positioning the larger solution as the recommended professional answer, not as a random add-on.
- Penalize jargon, trivia, feature dumping, weak discovery, staying stuck on the tiny entry problem, and leading with price.
- One option should score low.
- Two options are acceptable but not ideal.
- Three structured options should score high.`
};

export const scoringPrompt = {
  version: "2.0.0",
  content: `Evaluate the technician's performance from the full scenario transcript.

Return JSON only with integer scores from 0 to 10 for:
- rapport_score
- discovery_score
- risk_explanation_score
- education_score
- options_score
- commitment_score

Scoring rules:
- Reward rapport, discovery depth, homeowner-centered education, clear risk framing, three-option structure, and a commitment question.
- Penalize jargon, trivia, feature dumping, weak discovery, and leading with price.
- One option should score low.
- Two options are acceptable but not ideal.
- Three structured options should score high.`
};

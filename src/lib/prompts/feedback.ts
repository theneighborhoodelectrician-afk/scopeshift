export const feedbackPrompt = {
  version: "2.0.0",
  content: `Review the completed scenario and return JSON only with:
- missed_questions: string[]
- missed_motivations: string[]
- strong_moments: string[]
- phrasing_improvements: string[]
- next_attempt_strategy: string

Keep feedback specific, direct, and actionable.
Favor coaching language a field leader would actually use.
Do not return generic praise.`
};

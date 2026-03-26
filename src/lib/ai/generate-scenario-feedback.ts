import { aiClient, generateJson } from "@/lib/ai/client";
import { feedbackPrompt } from "@/lib/prompts/feedback";
import { analyzeScopeExpansion } from "@/lib/scoring/detection";
import { buildFeedback } from "@/lib/scoring/rubric";

type FeedbackPayload = {
  missed_questions: string[];
  missed_motivations: string[];
  strong_moments: string[];
  phrasing_improvements: string[];
  next_attempt_strategy: string;
};

function fallbackFeedback(messages: string[], hiddenMotivation: string) {
  const joined = messages.join(" ").toLowerCase();
  const scopeSignals = analyzeScopeExpansion(messages);

  return buildFeedback(
    {
      rapportBuilt: joined.includes("thanks") || joined.includes("appreciate"),
      discoveryTopicsCovered: [
        "timeline",
        "home age",
        "future renovation plans",
        "decision makers",
        "safety concerns",
        "budget expectations",
        "reason for call today"
      ].filter((topic) => joined.includes(topic.split(" ")[0])),
      identifiedMotivations: joined.includes("safety") ? [hiddenMotivation] : [],
      usedEducationRewards: joined.includes("safety") ? ["family safety framing"] : [],
      usedEducationPenalties: joined.includes("amp") ? ["amp rating discussion without context"] : [],
      optionsPresented: ["temporary", "recommended", "long-term"].filter((item) => joined.includes(item)).length,
      commitmentQuestionAsked:
        joined.includes("which option makes the most sense") || joined.includes("handle this today"),
      consequenceExplanationClear:
        joined.includes("risk") || joined.includes("failure") || joined.includes("safety"),
      pricePresentedLast: joined.includes("price first") === false,
      symptomToSystemLinks: scopeSignals.symptom_to_system_links,
      whileHereFraming: scopeSignals.while_here_framing,
      futureValueDiscovery: scopeSignals.future_value_discovery,
      largerSolutionPresented: scopeSignals.larger_solution_presented
    },
    [hiddenMotivation]
  );
}

export async function generateScenarioFeedback(messages: string[], hiddenMotivation: string) {
  if (aiClient.ready === false) {
    return fallbackFeedback(messages, hiddenMotivation);
  }

  try {
    const payload = await generateJson<FeedbackPayload>({
      instructions: feedbackPrompt.content,
      input: [
        "Hidden motivation: " + hiddenMotivation,
        "Transcript:",
        messages.join("\n")
      ].join("\n"),
      maxOutputTokens: 500
    });

    if (payload == null) {
      return fallbackFeedback(messages, hiddenMotivation);
    }

    const fallback = fallbackFeedback(messages, hiddenMotivation);

    return {
      missed_questions: Array.isArray(payload.missed_questions) ? payload.missed_questions : [],
      missed_motivations: Array.isArray(payload.missed_motivations) ? payload.missed_motivations : [],
      strong_moments: Array.isArray(payload.strong_moments) ? payload.strong_moments : [],
      phrasing_improvements: Array.isArray(payload.phrasing_improvements) ? payload.phrasing_improvements : fallback.phrasing_improvements,
      next_attempt_strategy: payload.next_attempt_strategy || fallback.next_attempt_strategy
    };
  } catch {
    return fallbackFeedback(messages, hiddenMotivation);
  }
}

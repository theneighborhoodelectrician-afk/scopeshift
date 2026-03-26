import { aiClient, generateJson } from "@/lib/ai/client";
import { scoringPrompt } from "@/lib/prompts/scoring";
import { analyzeScopeExpansion } from "@/lib/scoring/detection";
import { scorePerformance } from "@/lib/scoring/rubric";

type ScorePayload = {
  rapport_score: number;
  discovery_score: number;
  risk_explanation_score: number;
  education_score: number;
  options_score: number;
  commitment_score: number;
  scope_expansion_score: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function fallbackScore(messages: string[]) {
  const joined = messages.join(" ").toLowerCase();
  const discoveryTopicsCovered = [
    "timeline",
    "budget expectations",
    "decision makers",
    "safety concerns",
    "home age",
    "future renovation plans",
    "reason for call today"
  ].filter((topic) => joined.includes(topic.split(" ")[0]));
  const scopeSignals = analyzeScopeExpansion(messages);

  return scorePerformance({
    rapportBuilt: joined.includes("thanks") || joined.includes("appreciate") || joined.includes("glad"),
    discoveryTopicsCovered,
    identifiedMotivations: joined.includes("safety") ? ["worried about family safety"] : [],
    usedEducationRewards: ["family safety framing", "future failure explanation", "capacity limitations", "timeline consequences"].filter((item) =>
      joined.includes(item.includes("family") ? "safety" : item.includes("future") ? "future" : item.includes("capacity") ? "capacity" : "today")
    ),
    usedEducationPenalties: ["tool talk", "feature dumping"].filter((item) =>
      joined.includes(item.includes("tool") ? "amp" : "feature")
    ),
    optionsPresented: ["temporary", "recommended", "long-term"].filter((item) => joined.includes(item)).length,
    commitmentQuestionAsked:
      joined.includes("which option makes the most sense") ||
      joined.includes("handle this today") ||
      joined.includes("take care of this while we are here"),
    consequenceExplanationClear: joined.includes("safety") || joined.includes("failure") || joined.includes("risk"),
    pricePresentedLast: joined.includes("price first") === false,
    symptomToSystemLinks: scopeSignals.symptom_to_system_links,
    whileHereFraming: scopeSignals.while_here_framing,
    futureValueDiscovery: scopeSignals.future_value_discovery,
    largerSolutionPresented: scopeSignals.larger_solution_presented
  });
}

export async function scoreScenario(messages: string[]) {
  const fallback = fallbackScore(messages);

  if (aiClient.ready === false) {
    return fallback;
  }

  try {
    const payload = await generateJson<ScorePayload>({
      instructions: scoringPrompt.content,
      input: ["Transcript:", messages.join("\n")].join("\n"),
      maxOutputTokens: 320
    });

    if (payload == null) {
      return fallback;
    }

    return {
      rapport_score: clamp(payload.rapport_score),
      discovery_score: clamp(payload.discovery_score),
      risk_explanation_score: clamp(payload.risk_explanation_score),
      education_score: clamp(payload.education_score),
      options_score: clamp(payload.options_score),
      commitment_score: clamp(payload.commitment_score),
      scope_expansion_score:
        typeof payload.scope_expansion_score === "number"
          ? clamp(payload.scope_expansion_score)
          : fallback.scope_expansion_score
    };
  } catch {
    return fallback;
  }
}

import { buildFeedback } from "@/lib/scoring/rubric";

export async function generateScenarioFeedback(messages: string[], hiddenMotivation: string) {
  const joined = messages.join(" ").toLowerCase();

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
      pricePresentedLast: !joined.includes("price first")
    },
    [hiddenMotivation]
  );
}

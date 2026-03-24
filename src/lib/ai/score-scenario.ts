import { scorePerformance } from "@/lib/scoring/rubric";

export async function scoreScenario(messages: string[]) {
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

  return scorePerformance({
    rapportBuilt: joined.includes("thanks") || joined.includes("appreciate") || joined.includes("glad"),
    discoveryTopicsCovered,
    identifiedMotivations: joined.includes("safety") ? ["worried about family safety"] : [],
    usedEducationRewards: ["family safety framing", "future failure explanation"].filter((item) =>
      joined.includes(item.includes("family") ? "safety" : "future")
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
    pricePresentedLast: !joined.includes("price first")
  });
}

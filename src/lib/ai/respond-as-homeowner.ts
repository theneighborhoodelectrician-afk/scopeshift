import type { ScenarioTurn } from "@prisma/client";
import type { GeneratedScenario } from "@/types/scenario";
import { analyzeTurn } from "@/lib/scoring/detection";

export async function respondAsHomeowner(input: {
  scenario: GeneratedScenario;
  technicianMessage: string;
  priorTurns: Array<Pick<ScenarioTurn, "speaker" | "messageText">>;
}) {
  const analysis = analyzeTurn(input.technicianMessage);
  const personality = input.scenario.homeowner_personality.replaceAll("_", " ");
  const discoveryLead = analysis.discovery_detected
    ? "I appreciate you asking a few questions before jumping to a fix."
    : "I was hoping you could tell me what you think is going on.";
  const objectionLead = input.priorTurns.length > 4
    ? "I just want to make sure this is really necessary and not more than we need."
    : `We mainly called about the ${input.scenario.visible_problem}, so I want to understand what you are seeing.`;

  return `${discoveryLead} As a ${personality} homeowner, ${objectionLead}`;
}

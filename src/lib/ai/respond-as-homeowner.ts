import type { ScenarioTurn } from "@prisma/client";
import type { GeneratedScenario } from "@/types/scenario";
import { analyzeTurn } from "@/lib/scoring/detection";
import { aiClient, generateText } from "@/lib/ai/client";
import { homeownerBehaviorPrompt } from "@/lib/prompts/homeowner-behavior";
import { systemRolePrompt } from "@/lib/prompts/system-role";

function fallbackResponse(input: {
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
    : "We mainly called about the " + input.scenario.visible_problem + ", so I want to understand what you are seeing.";

  return discoveryLead + " As a " + personality + " homeowner, " + objectionLead;
}

export async function respondAsHomeowner(input: {
  scenario: GeneratedScenario;
  technicianMessage: string;
  priorTurns: Array<Pick<ScenarioTurn, "speaker" | "messageText">>;
}) {
  if (aiClient.ready === false) {
    return fallbackResponse(input);
  }

  const transcript = input.priorTurns
    .map((turn) => turn.speaker.toUpperCase() + ": " + turn.messageText)
    .join("\n");

  const instructions = [systemRolePrompt.content, homeownerBehaviorPrompt.content].join("\n\n");
  const prompt = [
    "Current scenario:",
    JSON.stringify(input.scenario, null, 2),
    "",
    "Conversation so far:",
    transcript || "No prior turns yet.",
    "",
    "Latest technician message: " + input.technicianMessage,
    "",
    "Write the homeowner response only.",
    "Stay natural and specific to the house, the concern, and the current trust level.",
    "If the technician is vague, ask a real homeowner follow-up question.",
    "Do not add labels, coaching, bullet points, or explanation."
  ].join("\n");

  try {
    const response = await generateText({
      instructions,
      input: prompt,
      maxOutputTokens: 220
    });

    return response?.trim() || fallbackResponse(input);
  } catch {
    return fallbackResponse(input);
  }
}

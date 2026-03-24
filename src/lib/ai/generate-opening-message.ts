import type { GeneratedScenario } from "@/types/scenario";

export async function generateOpeningMessage(scenario: GeneratedScenario) {
  return scenario.opening_homeowner_message;
}

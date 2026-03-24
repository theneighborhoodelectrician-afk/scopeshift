import type { GeneratedScenario } from "@/types/scenario";
import { aiClient, generateText } from "@/lib/ai/client";
import { homeownerBehaviorPrompt } from "@/lib/prompts/homeowner-behavior";
import { systemRolePrompt } from "@/lib/prompts/system-role";

function fallbackOpeningMessage(scenario: GeneratedScenario) {
  return scenario.opening_homeowner_message;
}

export async function generateOpeningMessage(scenario: GeneratedScenario) {
  if (aiClient.ready === false) {
    return fallbackOpeningMessage(scenario);
  }

  try {
    const response = await generateText({
      instructions: [systemRolePrompt.content, homeownerBehaviorPrompt.content].join("\n\n"),
      input: [
        "Write the homeowner opening line for the start of the scenario.",
        "Make it sound like a real person in a real house, not a template.",
        "Mention one concrete household detail, what happened, and why they called now.",
        "Do not start every opening with the same greeting.",
        "Do not repeat raw field names like urgency levels or category labels.",
        "Return only the homeowner opening message.",
        JSON.stringify(scenario, null, 2)
      ].join("\n\n"),
      maxOutputTokens: 140
    });

    return response?.trim() || fallbackOpeningMessage(scenario);
  } catch {
    return fallbackOpeningMessage(scenario);
  }
}

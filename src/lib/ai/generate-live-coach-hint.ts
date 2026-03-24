import { analyzeTurn } from "@/lib/scoring/detection";
import { aiClient, generateText } from "@/lib/ai/client";
import { liveCoachPrompt } from "@/lib/prompts/live-coach";

function fallbackHint(input: {
  technicianMessage: string;
  coachMode: "off" | "light" | "full";
}) {
  if (input.coachMode === "off") {
    return null;
  }

  const analysis = analyzeTurn(input.technicianMessage);
  if (analysis.discovery_detected === false) {
    return "Ask what prompted the call today and how long they have noticed the issue.";
  }

  if (analysis.option_count_detected < 2 && input.coachMode === "full") {
    return "Frame the temporary, recommended, and long-term options so the homeowner can compare clearly.";
  }

  if (analysis.commitment_attempt_detected === false && input.coachMode === "full") {
    return "Before ending, ask which option makes the most sense today.";
  }

  return input.coachMode === "light"
    ? "Keep building discovery before you move into solutions."
    : "Connect the issue to safety, reliability, or future failure before talking about price.";
}

export async function generateLiveCoachHint(input: {
  technicianMessage: string;
  coachMode: "off" | "light" | "full";
}) {
  if (aiClient.ready === false) {
    return fallbackHint(input);
  }

  if (input.coachMode === "off") {
    return null;
  }

  try {
    const hint = await generateText({
      instructions: liveCoachPrompt.content,
      input: [
        "Coach mode: " + input.coachMode,
        "Technician message: " + input.technicianMessage,
        "Return one short coaching hint only."
      ].join("\n"),
      maxOutputTokens: 120
    });

    return hint?.trim() || fallbackHint(input);
  } catch {
    return fallbackHint(input);
  }
}

import { analyzeTurn } from "@/lib/scoring/detection";

export async function generateLiveCoachHint(input: {
  technicianMessage: string;
  coachMode: "off" | "light" | "full";
}) {
  if (input.coachMode === "off") {
    return null;
  }

  const analysis = analyzeTurn(input.technicianMessage);
  if (!analysis.discovery_detected) {
    return "Ask what prompted the call today and how long they have noticed the issue.";
  }

  if (analysis.option_count_detected < 2 && input.coachMode === "full") {
    return "Frame the temporary, recommended, and long-term options so the homeowner can compare clearly.";
  }

  if (!analysis.commitment_attempt_detected && input.coachMode === "full") {
    return "Before ending, ask which option makes the most sense today.";
  }

  return input.coachMode === "light"
    ? "Keep building discovery before you move into solutions."
    : "Connect the issue to safety, reliability, or future failure before talking about price.";
}

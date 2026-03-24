import type { ScenarioTurn } from "@prisma/client";
import type { GeneratedScenario } from "@/types/scenario";
import { analyzeTurn } from "@/lib/scoring/detection";
import { aiClient, generateText } from "@/lib/ai/client";
import { homeownerBehaviorPrompt } from "@/lib/prompts/homeowner-behavior";
import { systemRolePrompt } from "@/lib/prompts/system-role";

type TranscriptTurn = Pick<ScenarioTurn, "speaker" | "messageText">;

type HomeownerReply = {
  message: string;
  source: "model" | "fallback_no_key" | "fallback_empty" | "fallback_error";
};

function countTurns(turns: TranscriptTurn[], speaker: TranscriptTurn["speaker"]) {
  return turns.filter((turn) => turn.speaker === speaker).length;
}

function technicianMessages(turns: TranscriptTurn[]) {
  return turns
    .filter((turn) => turn.speaker === "technician")
    .map((turn) => turn.messageText);
}

function joinedTechnicianText(turns: TranscriptTurn[]) {
  return technicianMessages(turns).join(" ").toLowerCase();
}

function discoveryCount(turns: TranscriptTurn[]) {
  return technicianMessages(turns).reduce((total, message) => {
    const analysis = analyzeTurn(message);
    if (analysis.discovery_detected) {
      return total + 1;
    }
    return total;
  }, 0);
}

function optionCount(turns: TranscriptTurn[]) {
  return technicianMessages(turns).reduce((highest, message) => {
    const analysis = analyzeTurn(message);
    return Math.max(highest, analysis.option_count_detected);
  }, 0);
}

function trustLevel(turns: TranscriptTurn[]) {
  const techText = joinedTechnicianText(turns);
  const discovery = discoveryCount(turns);
  const hasPlainLanguage =
    techText.includes("safe") ||
    techText.includes("risk") ||
    techText.includes("happen if") ||
    techText.includes("could fail");
  const hasRapport =
    techText.includes("thank") ||
    techText.includes("appreciate") ||
    techText.includes("glad") ||
    techText.includes("walk you through");

  if (discovery >= 3 && hasPlainLanguage && hasRapport) {
    return "high";
  }

  if (discovery >= 1 || hasPlainLanguage || hasRapport) {
    return "building";
  }

  return "low";
}

function objectionStage(turns: TranscriptTurn[]) {
  const techText = joinedTechnicianText(turns);
  const trust = trustLevel(turns);
  const options = optionCount(turns);

  if (techText.includes("price") && trust === "low") {
    return "price_resistance";
  }

  if (options >= 2 && trust === "building") {
    return "soft_hesitation";
  }

  if (countTurns(turns, "technician") >= 2) {
    return "clarification";
  }

  return "curiosity";
}

function privateBackstory(scenario: GeneratedScenario) {
  const pieces: string[] = [];

  if (scenario.visible_problem === "breaker tripping") {
    pieces.push("The homeowner has noticed the problem during normal household use, often in the kitchen or a lived-in part of the house.");
  } else if (scenario.visible_problem === "flickering lights") {
    pieces.push("The homeowner has seen the issue in specific rooms and is wondering whether it means something bigger is going on.");
  } else if (scenario.visible_problem === "partial power loss") {
    pieces.push("The homeowner is unsettled because some things work and some do not, which feels abnormal and hard to interpret.");
  } else if (scenario.visible_problem === "EV charger request") {
    pieces.push("The homeowner is planning ahead and wants a realistic answer about what the home can handle.");
  } else if (scenario.visible_problem === "kitchen remodel prep") {
    pieces.push("The homeowner wants to avoid surprises once the project starts and is trying to think ahead.");
  } else {
    pieces.push("The homeowner called because the issue became concrete enough to stop putting off.");
  }

  if (scenario.hidden_motivation === "preparing for guests") {
    pieces.push("Privately, guests are coming soon and the homeowner wants the house to feel under control.");
  } else if (scenario.hidden_motivation === "worried about family safety") {
    pieces.push("Privately, the homeowner is worried the issue might be unsafe for the family.");
  } else if (scenario.hidden_motivation === "planning to sell home") {
    pieces.push("Privately, the homeowner is thinking about resale and does not want electrical problems hanging over the house.");
  } else if (scenario.hidden_motivation === "needs solution today") {
    pieces.push("Privately, timing matters a lot today even if the homeowner does not say that right away.");
  } else if (scenario.hidden_motivation === "does not trust upsells") {
    pieces.push("Privately, the homeowner is on guard for anything that feels bigger than the original call.");
  } else if (scenario.hidden_motivation === "bad experience with contractor") {
    pieces.push("Privately, a past contractor experience makes the homeowner slower to trust and more sensitive to vague explanations.");
  }

  if (scenario.spouse_involved) {
    pieces.push("Another decision maker is part of this household, even if they are not in the conversation yet.");
  }

  if (scenario.prior_contractor_seen) {
    pieces.push("Someone else has looked at this before, which shapes how quickly the homeowner trusts new advice.");
  }

  if (scenario.home_age_range) {
    pieces.push("The home age range is " + scenario.home_age_range + ".");
  }

  return pieces.join(" ");
}

function personaVoice(personality: string) {
  if (personality === "budget_sensitive") {
    return "Careful, practical, and alert to whether the recommendation sounds bigger than necessary.";
  }
  if (personality === "trust_first") {
    return "Open if the technician feels honest and clear, but still wants plain-language reassurance.";
  }
  if (personality === "safety_motivated") {
    return "Sensitive to family safety and more likely to react when risk becomes clear.";
  }
  if (personality === "comparison_shopper") {
    return "Measured, evaluative, and likely to compare what they hear against other opinions or expectations.";
  }
  if (personality === "busy_homeowner") {
    return "Pressed for time, direct, and impatient with rambling or overly technical explanations.";
  }
  if (personality === "skeptical_homeowner") {
    return "Guarded, alert for overselling, and slower to buy into conclusions without clear reasoning.";
  }
  return "Natural and conversational.";
}

function latestHomeownerTurn(turns: TranscriptTurn[]) {
  const homeownerTurns = turns.filter((turn) => turn.speaker === "homeowner");
  return homeownerTurns[homeownerTurns.length - 1]?.messageText || "";
}

function fallbackMessage(input: {
  scenario: GeneratedScenario;
  technicianMessage: string;
  priorTurns: TranscriptTurn[];
}) {
  const analysis = analyzeTurn(input.technicianMessage);
  const trust = trustLevel(input.priorTurns);
  const problem = input.scenario.visible_problem;

  if (analysis.discovery_detected) {
    if (trust === "low") {
      return "Sure, I can answer that. I just want to understand whether this is a small issue or something bigger going on behind the " + problem + ".";
    }

    return "That is fair. I can give you a little more background if it helps, because I would rather figure out why this started than keep guessing at it.";
  }

  if (analysis.option_count_detected > 0) {
    return "I am following you so far, but I still need to understand what is actually causing it before I know how serious that sounds.";
  }

  return "Can you help me understand what you think is going on here, in plain language?";
}

export async function respondAsHomeowner(input: {
  scenario: GeneratedScenario;
  technicianMessage: string;
  priorTurns: TranscriptTurn[];
}): Promise<HomeownerReply> {
  if (aiClient.ready === false) {
    return {
      message: fallbackMessage(input),
      source: "fallback_no_key"
    };
  }

  const transcript = input.priorTurns
    .map((turn) => turn.speaker.toUpperCase() + ": " + turn.messageText)
    .join("\n");

  const stateSummary = [
    "Trust level: " + trustLevel(input.priorTurns),
    "Current objection stage: " + objectionStage(input.priorTurns),
    "Technician discovery count: " + String(discoveryCount(input.priorTurns)),
    "Best option depth shown so far: " + String(optionCount(input.priorTurns)),
    "Homeowner voice: " + personaVoice(input.scenario.homeowner_personality),
    "Private backstory: " + privateBackstory(input.scenario),
    "Last homeowner message: " + (latestHomeownerTurn(input.priorTurns) || "None yet")
  ].join("\n");

  const instructions = [systemRolePrompt.content, homeownerBehaviorPrompt.content].join("\n\n");
  const prompt = [
    "Current scenario:",
    JSON.stringify(input.scenario, null, 2),
    "",
    "Live homeowner state:",
    stateSummary,
    "",
    "Conversation so far:",
    transcript || "No prior turns yet.",
    "",
    "Latest technician message:",
    input.technicianMessage,
    "",
    "Reply as the homeowner only.",
    "Respond to what the technician just said, not to the training system.",
    "Carry forward memory, emotion, and trust from the conversation so far.",
    "Use one concrete household detail or concern when it feels natural.",
    "Ask a real-life follow-up question if the technician is unclear, vague, or too technical.",
    "Do not repeat the same concern word-for-word unless that would happen naturally.",
    "Do not add labels, bullets, coaching, or explanation."
  ].join("\n");

  try {
    const response = await generateText({
      instructions,
      input: prompt,
      maxOutputTokens: 220
    });

    if (response == null || response.trim() === "") {
      return {
        message: fallbackMessage(input),
        source: "fallback_empty"
      };
    }

    return {
      message: response.trim(),
      source: "model"
    };
  } catch {
    return {
      message: fallbackMessage(input),
      source: "fallback_error"
    };
  }
}

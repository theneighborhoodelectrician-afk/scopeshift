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
    techText.includes("could fail") ||
    techText.includes("means") ||
    techText.includes("because");
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

function scopeExpansionOpportunity(scenario: GeneratedScenario) {
  const hidden = scenario.hidden_problem;

  if (hidden === "aging panel") {
    return "The larger professional solution may involve panel reliability, cleanup, or upgrade work rather than a tiny isolated repair.";
  }
  if (hidden === "double tapped breakers") {
    return "The larger professional solution may involve panel correction and safety cleanup rather than just addressing the symptom.";
  }
  if (hidden === "no surge protection") {
    return "The larger professional solution may involve whole-home protection while the technician is already onsite.";
  }
  if (hidden === "open grounds") {
    return "The larger professional solution may involve correcting grounding and explaining safety implications beyond the visible device.";
  }
  if (hidden === "overloaded circuit") {
    return "The larger professional solution may involve a dedicated circuit or load separation, not just resetting the problem.";
  }
  if (hidden === "outdated wiring") {
    return "The larger professional solution may involve wiring correction or broader safety updates in this area of the home.";
  }
  if (hidden === "no dedicated circuit") {
    return "The larger professional solution may involve adding a dedicated circuit for how the homeowner uses the space now or plans to use it later.";
  }
  if (hidden === "unsafe temporary repair") {
    return "The larger professional solution may involve replacing a temporary fix with a real corrective repair before it causes another problem.";
  }
  if (hidden === "capacity limitation") {
    return "The larger professional solution may involve future-ready capacity work rather than only solving the immediate symptom.";
  }
  if (hidden === "panel brand reliability concern") {
    return "The larger professional solution may involve a reliability conversation about the service equipment, not only the current complaint.";
  }

  return "The larger professional solution may involve a broader safety, reliability, or capacity conversation while the technician is already there.";
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

  pieces.push(scopeExpansionOpportunity(scenario));

  if (scenario.hidden_motivation === "preparing for guests") {
    pieces.push("Privately, guests are coming soon and the homeowner wants the house to feel under control.");
  } else if (scenario.hidden_motivation === "worried about family safety") {
    pieces.push("Privately, the homeowner is worried the issue might be unsafe for the family.");
  } else if (scenario.hidden_motivation === "planning to sell home") {
    pieces.push("Privately, the homeowner is thinking about resale and does not want electrical problems hanging over the house.");
  } else if (scenario.hidden_motivation === "needs solution today") {
    pieces.push("Privately, timing matters a lot today even if the homeowner does not say that right away.");
  } else if (scenario.hidden_motivation === "does not trust upsells") {
    pieces.push("Privately, the homeowner is on guard for anything that feels bigger than the original call unless the explanation really connects the dots.");
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
  const hiddenDirection = scopeExpansionOpportunity(input.scenario).toLowerCase();

  if (analysis.discovery_detected) {
    if (trust === "low") {
      return "Sure, I can answer that. I mostly need to understand whether this " + problem + " is just the symptom or whether it points to something bigger we should handle while you are already here.";
    }

    return "That helps. I can give you more background, because I would rather know whether this is a one-spot issue or part of a larger problem in the house.";
  }

  if (analysis.option_count_detected > 0) {
    return "I am following you, but before I think about options I still need to understand what this means for the house and whether it is really a bigger issue worth taking care of now.";
  }

  if (input.technicianMessage.toLowerCase().includes("safe") || input.technicianMessage.toLowerCase().includes("fine")) {
    return "Can you connect that for me in plain language? I am trying to understand whether this is actually small or if it could turn into something bigger.";
  }

  return "Can you help me understand what you think is going on here, in plain language, and whether this sounds like a small fix or something bigger we should take care of while you are here?";
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
    .join("
");

  const stateSummary = [
    "Trust level: " + trustLevel(input.priorTurns),
    "Current objection stage: " + objectionStage(input.priorTurns),
    "Technician discovery count: " + String(discoveryCount(input.priorTurns)),
    "Best option depth shown so far: " + String(optionCount(input.priorTurns)),
    "Homeowner voice: " + personaVoice(input.scenario.homeowner_personality),
    "Private backstory: " + privateBackstory(input.scenario),
    "Hidden scope opportunity: " + scopeExpansionOpportunity(input.scenario),
    "Last homeowner message: " + (latestHomeownerTurn(input.priorTurns) || "None yet")
  ].join("
");

  const instructions = [systemRolePrompt.content, homeownerBehaviorPrompt.content].join("

");
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
    "Carry forward memory, emotion, trust, and hesitation from the conversation so far.",
    "Keep the live issue grounded in this house, but let the homeowner care about whether it points to a larger problem worth addressing while the technician is already onsite.",
    "Use one concrete household detail or concern when it feels natural.",
    "Ask a real-life follow-up question if the technician is unclear, vague, too technical, or not connecting the symptom to the larger picture.",
    "Do not repeat the same concern word-for-word unless that would happen naturally.",
    "Do not add labels, bullets, coaching, or explanation."
  ].join("
");

  try {
    const response = await generateText({
      instructions,
      input: prompt,
      maxOutputTokens: 420,
      reasoningEffort: "low"
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

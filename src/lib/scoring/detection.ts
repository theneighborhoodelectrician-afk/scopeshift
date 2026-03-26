import type { TurnAnalysis } from "@/types/scenario";

const discoveryMatchers = [
  { key: "timeline", words: ["how long", "when did", "started", "noticed"] },
  { key: "budget expectations", words: ["budget", "investment", "range"] },
  { key: "decision makers", words: ["who else", "decision", "spouse", "together"] },
  { key: "safety concerns", words: ["safe", "safety", "worried", "concern"] },
  { key: "home age", words: ["how old", "year built", "older home"] },
  { key: "future renovation plans", words: ["renovation", "remodel", "future plans"] },
  { key: "reason for call today", words: ["why today", "prompted", "what changed"] }
];

const commitmentMatchers = [
  "which option makes the most sense",
  "would you like us to handle this today",
  "should we take care of this while we're here"
];

const symptomToSystemMatchers = [
  "bigger issue",
  "larger issue",
  "broader issue",
  "underlying issue",
  "underlying problem",
  "root cause",
  "not just",
  "points to",
  "behind this",
  "behind the",
  "whole-home",
  "whole home",
  "service equipment",
  "panel",
  "capacity"
];

const whileHereMatchers = [
  "while we're here",
  "while we are here",
  "while i'm here",
  "while i am here",
  "already here",
  "already onsite",
  "while you are here",
  "while you're here"
];

const futureValueMatchers = [
  "future plans",
  "down the road",
  "later on",
  "eventually",
  "capacity",
  "support later",
  "what else",
  "dedicated circuit",
  "service upgrade",
  "future-ready",
  "future ready",
  "ev charger",
  "remodel"
];

const largerSolutionMatchers = [
  "upgrade",
  "surge protection",
  "whole-home",
  "whole home",
  "dedicated circuit",
  "panel",
  "service upgrade",
  "future-ready",
  "future ready",
  "recommended",
  "long-term",
  "best option"
];

function countMatches(normalized: string, matchers: string[]) {
  return matchers.reduce((total, matcher) => {
    if (normalized.includes(matcher)) {
      return total + 1;
    }
    return total;
  }, 0);
}

export function analyzeTurn(message: string): TurnAnalysis {
  const normalized = message.toLowerCase();
  const detected = discoveryMatchers
    .filter((matcher) => matcher.words.some((word) => normalized.includes(word)))
    .map((matcher) => matcher.key);

  const option_count_detected = ["temporary", "recommended", "long-term", "best option"].filter((term) =>
    normalized.includes(term)
  ).length;

  return {
    discovery_detected: detected.length > 0,
    option_count_detected,
    commitment_attempt_detected: commitmentMatchers.some((term) => normalized.includes(term)),
    detected_discovery_questions: detected
  };
}

export function analyzeScopeExpansion(messages: string[]) {
  const normalized = messages.join(" ").toLowerCase();

  return {
    symptom_to_system_links: countMatches(normalized, symptomToSystemMatchers),
    while_here_framing: whileHereMatchers.some((term) => normalized.includes(term)),
    future_value_discovery: futureValueMatchers.some((term) => normalized.includes(term)),
    larger_solution_presented: largerSolutionMatchers.some((term) => normalized.includes(term))
  };
}

export function scoreScopeExpansion(messages: string[]) {
  const signals = analyzeScopeExpansion(messages);
  let score = 1;

  score += Math.min(3, signals.symptom_to_system_links);

  if (signals.while_here_framing) {
    score += 2;
  }

  if (signals.future_value_discovery) {
    score += 2;
  }

  if (signals.larger_solution_presented) {
    score += 2;
  }

  return Math.max(0, Math.min(10, score));
}

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

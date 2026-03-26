export type Scorecard = {
  rapport_score: number;
  discovery_score: number;
  risk_explanation_score: number;
  education_score: number;
  options_score: number;
  commitment_score: number;
  scope_expansion_score: number;
};

export type FeedbackReport = {
  missed_questions: string[];
  missed_motivations: string[];
  strong_moments: string[];
  phrasing_improvements: string[];
  next_attempt_strategy: string;
};

export type PerformanceSignals = {
  rapportBuilt: boolean;
  discoveryTopicsCovered: string[];
  identifiedMotivations: string[];
  usedEducationRewards: string[];
  usedEducationPenalties: string[];
  optionsPresented: number;
  commitmentQuestionAsked: boolean;
  consequenceExplanationClear: boolean;
  pricePresentedLast: boolean;
  symptomToSystemLinks: number;
  whileHereFraming: boolean;
  futureValueDiscovery: boolean;
  largerSolutionPresented: boolean;
};

const REQUIRED_DISCOVERY = [
  "timeline",
  "home age",
  "future renovation plans",
  "decision makers",
  "safety concerns",
  "budget expectations",
  "reason for call today"
];

const EDUCATION_REWARDS = [
  "family safety framing",
  "future failure explanation",
  "insurance implications",
  "resale positioning",
  "capacity limitations",
  "timeline consequences"
];

const EDUCATION_PENALTIES = [
  "tool talk",
  "panel brand trivia",
  "amp rating discussion without context",
  "feature dumping",
  "code citations without meaning"
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, value));
}

export function createEmptyScorecard(): Scorecard {
  return {
    rapport_score: 0,
    discovery_score: 0,
    risk_explanation_score: 0,
    education_score: 0,
    options_score: 0,
    commitment_score: 0,
    scope_expansion_score: 0
  };
}

export function createEmptyFeedback(): FeedbackReport {
  return {
    missed_questions: [],
    missed_motivations: [],
    strong_moments: [],
    phrasing_improvements: [],
    next_attempt_strategy: ""
  };
}

export function scorePerformance(signals: PerformanceSignals): Scorecard {
  const discoveryCoverage = REQUIRED_DISCOVERY.filter((topic) =>
    signals.discoveryTopicsCovered.includes(topic)
  ).length;
  const educationHits = EDUCATION_REWARDS.filter((item) =>
    signals.usedEducationRewards.includes(item)
  ).length;
  const educationMisses = EDUCATION_PENALTIES.filter((item) =>
    signals.usedEducationPenalties.includes(item)
  ).length;

  const rapport_score = clampScore(signals.rapportBuilt ? 8 : 3);
  const discovery_score = clampScore(Math.round((discoveryCoverage / REQUIRED_DISCOVERY.length) * 10));
  const risk_explanation_score = clampScore(
    (signals.consequenceExplanationClear ? 6 : 2) + (signals.pricePresentedLast ? 2 : -1)
  );
  const education_score = clampScore(4 + educationHits - educationMisses);

  let options_score = 2;
  if (signals.optionsPresented === 1) {
    options_score = 1;
  } else if (signals.optionsPresented === 2) {
    options_score = 6;
  } else if (signals.optionsPresented >= 3) {
    options_score = 9;
  }

  const commitment_score = clampScore(signals.commitmentQuestionAsked ? 9 : 2);
  const scope_expansion_score = clampScore(
    1 +
      Math.min(3, signals.symptomToSystemLinks) +
      (signals.whileHereFraming ? 2 : 0) +
      (signals.futureValueDiscovery ? 2 : 0) +
      (signals.largerSolutionPresented ? 2 : 0)
  );

  return {
    rapport_score,
    discovery_score,
    risk_explanation_score,
    education_score,
    options_score,
    commitment_score,
    scope_expansion_score
  };
}

export function buildFeedback(
  signals: PerformanceSignals,
  hiddenMotivations: string[]
): FeedbackReport {
  const missed_questions = REQUIRED_DISCOVERY.filter(
    (topic) => !signals.discoveryTopicsCovered.includes(topic)
  );
  const missed_motivations = hiddenMotivations.filter(
    (motivation) => !signals.identifiedMotivations.includes(motivation)
  );

  const strong_moments: string[] = [];
  if (signals.rapportBuilt) {
    strong_moments.push("Built rapport early instead of rushing into a diagnosis.");
  }
  if (signals.consequenceExplanationClear) {
    strong_moments.push("Explained homeowner consequences in plain language.");
  }
  if (signals.optionsPresented >= 3) {
    strong_moments.push("Presented temporary, recommended, and long-term options.");
  }
  if (signals.commitmentQuestionAsked) {
    strong_moments.push("Asked for a decision instead of ending with information only.");
  }
  if (signals.symptomToSystemLinks > 0 || signals.whileHereFraming || signals.largerSolutionPresented) {
    strong_moments.push("Expanded the call beyond the tiny entry problem and positioned a larger professional solution.");
  }

  const phrasing_improvements: string[] = [];
  if (!signals.pricePresentedLast) {
    phrasing_improvements.push("Clarify the risk first, then discuss investment after the homeowner understands the options.");
  }
  if (signals.usedEducationPenalties.length > 0) {
    phrasing_improvements.push("Replace technical talk with homeowner outcomes like safety, reliability, resale, and timeline impact.");
  }
  if (!signals.commitmentQuestionAsked) {
    phrasing_improvements.push("Finish with a direct commitment question such as asking which option makes the most sense today.");
  }
  if (signals.symptomToSystemLinks === 0 && signals.largerSolutionPresented === false) {
    phrasing_improvements.push("Connect the visible symptom to the larger safety, reliability, or capacity issue so the bigger recommendation feels earned.");
  }
  if (signals.whileHereFraming === false) {
    phrasing_improvements.push("Use while-we-are-here language to show why handling the broader scope now is more professional and efficient.");
  }

  return {
    missed_questions,
    missed_motivations,
    strong_moments,
    phrasing_improvements,
    next_attempt_strategy:
      "Build trust, uncover the real motivation, connect the small symptom to the larger issue, present three professional options, and ask for the right work while you are already onsite."
  };
}

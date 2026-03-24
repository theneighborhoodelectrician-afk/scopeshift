export type TurnAnalysis = {
  discovery_detected: boolean;
  option_count_detected: number;
  commitment_attempt_detected: boolean;
  detected_discovery_questions: string[];
};

export type GeneratedScenario = {
  scenario_title: string;
  visible_problem: string;
  hidden_problem: string;
  homeowner_personality: string;
  hidden_motivation: string;
  objection_style: string;
  urgency_level: string;
  expected_best_path: string[];
  failure_conditions: string[];
  opening_homeowner_message: string;
  home_age_range: string | null;
  neighborhood_type: string | null;
  spouse_involved: boolean;
  prior_contractor_seen: boolean;
};

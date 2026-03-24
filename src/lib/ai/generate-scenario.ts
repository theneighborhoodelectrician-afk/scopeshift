import { CoachMode, DifficultyMode, ScenarioMode } from "@prisma/client";
import { visibleProblems } from "@/lib/constants/visible-problems";
import { hiddenProblems } from "@/lib/constants/hidden-problems";
import { homeownerPersonalities } from "@/lib/constants/personalities";
import { hiddenMotivations } from "@/lib/constants/motivations";
import { objectionStyles } from "@/lib/constants/objection-styles";
import { getRecentScenarioMemory } from "@/lib/scenario/anti-repetition";
import { titleCase } from "@/lib/utils";
import type { GeneratedScenario } from "@/types/scenario";

const urgencyLevels = ["low", "moderate", "high", "immediate_same_day"];
const discoveryTopics = [
  "timeline",
  "home age",
  "future renovation plans",
  "decision makers",
  "safety concerns",
  "budget expectations",
  "reason for call today"
];

const categoryVisibleProblemMap: Record<string, string[]> = {
  outlet_issue: ["dead outlet", "exterior outlet failure"],
  surge_protection: ["partial power loss", "breaker tripping"],
  panel_upgrade: ["breaker tripping", "partial power loss", "flickering lights"],
  generator_backup: ["generator backup question"],
  ev_charger: ["EV charger request"],
  fixture_install: ["fixture install request"],
  breaker_issue: ["breaker tripping"],
  partial_power: ["partial power loss"],
  gfci_issue: ["bathroom GFCI issue"],
  remodel_prep: ["kitchen remodel prep"]
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function openingMessage(problem: string, urgency: string) {
  return `Hi, thanks for coming out. We called because of a ${problem}, and it feels ${urgency.replaceAll("_", " ")} today.`;
}

export async function generateScenario(input: {
  userId: string;
  mode: ScenarioMode;
  difficultyMode: DifficultyMode;
  coachMode: CoachMode;
  category?: string;
  presetId?: string;
}) {
  const recent = await getRecentScenarioMemory(input.userId);
  const last = recent[0];

  let selectedVisibleProblems = visibleProblems;
  if (input.mode === "targeted" && input.category) {
    selectedVisibleProblems = categoryVisibleProblemMap[input.category] ?? visibleProblems;
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const scenario: GeneratedScenario = {
      scenario_title: "",
      visible_problem: randomItem(selectedVisibleProblems),
      hidden_problem: randomItem(hiddenProblems),
      homeowner_personality: randomItem(homeownerPersonalities),
      hidden_motivation: randomItem(hiddenMotivations),
      objection_style: randomItem(objectionStyles),
      urgency_level: randomItem(urgencyLevels),
      expected_best_path: [
        "Build rapport before probing deeper.",
        `Cover discovery topics: ${discoveryTopics.join(", ")}.`,
        "Teach consequences before discussing price.",
        "Present three structured options and ask for a decision."
      ],
      failure_conditions: [
        "Skipping discovery.",
        "Revealing hidden motivations too early.",
        "Discussing price before value and consequences are clear.",
        "Presenting only one option.",
        "Ending without a commitment question."
      ],
      opening_homeowner_message: "",
      home_age_range: randomItem(["1940s-1960s", "1970s-1990s", "2000s+", "mixed-era home"]),
      neighborhood_type: randomItem(["inner-ring suburb", "growing subdivision", "older established neighborhood"]),
      spouse_involved: Math.random() > 0.5,
      prior_contractor_seen: Math.random() > 0.65
    };

    if (
      last &&
      (last.visibleProblem === scenario.visible_problem ||
        last.homeownerPersonality === scenario.homeowner_personality ||
        last.hiddenMotivation === scenario.hidden_motivation)
    ) {
      continue;
    }

    scenario.scenario_title = `${titleCase(scenario.visible_problem)} in ${scenario.neighborhood_type}`;
    scenario.opening_homeowner_message = openingMessage(scenario.visible_problem, scenario.urgency_level);
    return scenario;
  }

  const fallbackVisible = selectedVisibleProblems[0] ?? visibleProblems[0];
  return {
    scenario_title: `${titleCase(fallbackVisible)} follow-up`,
    visible_problem: fallbackVisible,
    hidden_problem: hiddenProblems[0],
    homeowner_personality: homeownerPersonalities[0],
    hidden_motivation: hiddenMotivations[0],
    objection_style: objectionStyles[0],
    urgency_level: urgencyLevels[0],
    expected_best_path: ["Build rapport.", "Discover motivation.", "Present three options."],
    failure_conditions: ["Skipping discovery", "Leading with price"],
    opening_homeowner_message: openingMessage(fallbackVisible, urgencyLevels[0]),
    home_age_range: "1970s-1990s",
    neighborhood_type: "older established neighborhood",
    spouse_involved: false,
    prior_contractor_seen: false
  };
}

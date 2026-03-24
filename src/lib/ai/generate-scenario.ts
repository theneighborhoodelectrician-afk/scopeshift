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

const openingScenarios: Record<string, string[]> = {
  "dead outlet": [
    "One of the outlets in the living room stopped working this morning, and resetting things did not do anything.",
    "We noticed an outlet along the kitchen wall is dead, and today both plugs on it quit at the same time.",
    "There is an outlet in the guest room that has not been working right, and now it is not doing anything at all."
  ],
  "breaker tripping": [
    "The breaker has been tripping off and on, and today it kicked again when we had a couple kitchen appliances running.",
    "We keep losing the same circuit, and this morning it tripped twice while we were just using things normally.",
    "The breaker has been acting up for a little while, but today it started shutting off sooner than usual."
  ],
  "flickering lights": [
    "The lights in one part of the house keep flickering, and it has been more noticeable since this morning.",
    "We have a couple lights that dim and flicker when other things turn on, and today it felt worse than normal.",
    "The lights in the back rooms have been fluttering off and on, so we wanted somebody to take a look."
  ],
  "fixture install request": [
    "We wanted to have a new fixture installed, and before we buy the wrong thing I wanted to make sure the wiring is in good shape.",
    "We are replacing a light fixture and wanted to have it done right instead of guessing our way through it.",
    "We have a fixture we want to put in, and I figured it made sense to have someone look at the box and wiring first."
  ],
  "EV charger request": [
    "We are looking at getting an EV charger set up, and I wanted to know what the house can actually handle.",
    "We have an electric vehicle coming soon, so I wanted someone to tell us what it would take to add a charger here.",
    "I am trying to plan for an EV charger, but I do not know if the panel has enough room or capacity."
  ],
  "generator backup question": [
    "After the last outage, we started thinking seriously about backup power and wanted to understand what makes sense for this house.",
    "We have been talking about a generator after a couple recent outages, and I wanted to see what our options really are.",
    "We wanted to ask about backup power because the last time the neighborhood lost power it was a mess here."
  ],
  "partial power loss": [
    "Part of the house has power and part of it does not, and it started acting strange earlier today.",
    "We have a few rooms that seem half on and half off right now, so I wanted somebody out before it gets worse.",
    "Some circuits are working and some are not, and that is not something I wanted to let sit."
  ],
  "bathroom GFCI issue": [
    "The bathroom outlet keeps tripping, and today it would not stay reset long enough to use it.",
    "We have a GFCI in the bathroom that has been touchy, and this morning it started kicking out again.",
    "The bathroom outlet keeps shutting off, and now it is to the point where I do not trust it."
  ],
  "kitchen remodel prep": [
    "We are getting ready for a kitchen remodel and wanted to know what needs to be updated before the walls get opened up.",
    "We are planning some kitchen work and I wanted to understand whether the electrical side is ready for that.",
    "Before we get too far into this remodel, I wanted someone to tell us what the kitchen can support."
  ],
  "exterior outlet failure": [
    "The outside outlet stopped working, and I noticed it when I tried to plug something in this morning.",
    "We have an exterior outlet that is not working anymore, and I wanted to make sure there is not a bigger issue behind it.",
    "The outlet outside by the patio quit on us, and with the weather changing I figured we should get it checked."
  ]
};

const urgencyAddOns: Record<string, string[]> = {
  low: [
    "It is not a full emergency, but I did not want to ignore it.",
    "It has been on the list, and I figured now was a good time to get ahead of it."
  ],
  moderate: [
    "It is becoming regular enough that I wanted to deal with it before it turns into a bigger headache.",
    "I would rather handle it now than wait for it to fail at the worst time."
  ],
  high: [
    "It has been happening more often, so I wanted somebody out before it gets worse.",
    "It is definitely getting my attention now, which is why I called."
  ],
  immediate_same_day: [
    "I really wanted somebody out today because it changed fast and I do not want to sit on it.",
    "Today it crossed the line from annoying to something I wanted checked right away."
  ]
};

const personalityAddOns: Record<string, string[]> = {
  budget_sensitive: [
    "I am hoping we can understand what is actually needed before we do anything major.",
    "I just want to be smart about it and not throw money at the wrong fix."
  ],
  trust_first: [
    "If you can walk me through what you are seeing in plain language, that would help a lot.",
    "I mostly just want an honest read on what is going on."
  ],
  safety_motivated: [
    "Any time something electrical starts acting differently, I start thinking about whether it is safe.",
    "My biggest thing is making sure there is not a safety issue here."
  ],
  comparison_shopper: [
    "I am trying to understand what the right solution looks like before I make a decision.",
    "I have heard a few different opinions already, so I am trying to get a clear answer."
  ],
  busy_homeowner: [
    "I have a lot going on today, so I was hoping to get a straightforward read on it.",
    "I wanted to catch it now while I actually had someone here to look at it."
  ],
  skeptical_homeowner: [
    "I just want to make sure we are talking about the real problem and not more than that.",
    "I have had people overcomplicate things before, so I am hoping for a straight answer."
  ]
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function hashSeed(parts: string[]): number {
  let hash = 0;

  for (const part of parts) {
    for (const char of part) {
      hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
    }
  }

  return hash;
}

function pickBySeed(items: string[], seed: number, offset = 0): string {
  const safeItems = items.length > 0 ? items : [""];
  return safeItems[(seed + offset) % safeItems.length] || "";
}

function openingMessage(scenario: Pick<GeneratedScenario, "visible_problem" | "urgency_level" | "homeowner_personality">) {
  const seed = hashSeed([
    scenario.visible_problem,
    scenario.urgency_level,
    scenario.homeowner_personality
  ]);

  const opener = pickBySeed(openingScenarios[scenario.visible_problem] || ["We wanted to have someone take a look at an electrical issue we have been dealing with."], seed);
  const urgency = pickBySeed(urgencyAddOns[scenario.urgency_level] || urgencyAddOns.moderate, seed, 1);
  const personality = pickBySeed(personalityAddOns[scenario.homeowner_personality] || personalityAddOns.trust_first, seed, 2);

  return [opener, urgency, personality].join(" ");
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
    scenario.opening_homeowner_message = openingMessage(scenario);
    return scenario;
  }

  const fallbackVisible = selectedVisibleProblems[0] ?? visibleProblems[0];
  const fallbackScenario: GeneratedScenario = {
    scenario_title: `${titleCase(fallbackVisible)} follow-up`,
    visible_problem: fallbackVisible,
    hidden_problem: hiddenProblems[0],
    homeowner_personality: homeownerPersonalities[0],
    hidden_motivation: hiddenMotivations[0],
    objection_style: objectionStyles[0],
    urgency_level: urgencyLevels[0],
    expected_best_path: ["Build rapport.", "Discover motivation.", "Present three options."],
    failure_conditions: ["Skipping discovery", "Leading with price"],
    opening_homeowner_message: "",
    home_age_range: "1970s-1990s",
    neighborhood_type: "older established neighborhood",
    spouse_involved: false,
    prior_contractor_seen: false
  };

  fallbackScenario.opening_homeowner_message = openingMessage(fallbackScenario);
  return fallbackScenario;
}

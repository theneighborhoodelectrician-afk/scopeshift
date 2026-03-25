import { CoachMode, DifficultyMode, ScenarioMode } from "@prisma/client";
import { visibleProblems } from "@/lib/constants/visible-problems";
import { hiddenProblems } from "@/lib/constants/hidden-problems";
import { homeownerPersonalities } from "@/lib/constants/personalities";
import { hiddenMotivations } from "@/lib/constants/motivations";
import { objectionStyles } from "@/lib/constants/objection-styles";
import { targetedPracticeTracks } from "@/lib/constants/targeted-practice-tracks";
import { getRecentScenarioMemory } from "@/lib/scenario/anti-repetition";
import { titleCase } from "@/lib/utils";
import type { GeneratedScenario } from "@/types/scenario";

const urgencyLevels = ["moderate", "high", "immediate_same_day"];
const defaultDiscoveryTopics = [
  "reason for calling today",
  "how long the issue has been happening",
  "home age and panel history",
  "future electrical plans",
  "who helps make the decision",
  "safety concerns",
  "budget range and priority"
];

const categoryVisibleProblemMap: Record<string, string[]> = {
  outlet_issue: ["dead outlet", "exterior outlet failure", "bathroom GFCI issue"],
  surge_protection: ["breaker tripping", "partial power loss", "flickering lights"],
  panel_upgrade: ["breaker tripping", "flickering lights", "partial power loss"],
  generator_backup: ["generator backup question", "partial power loss", "flickering lights"],
  ev_charger: ["EV charger request", "kitchen remodel prep"],
  fixture_install: ["fixture install request", "kitchen remodel prep"],
  breaker_issue: ["breaker tripping", "bathroom GFCI issue", "dead outlet"],
  partial_power: ["partial power loss", "flickering lights"],
  gfci_issue: ["bathroom GFCI issue", "dead outlet"],
  remodel_prep: ["kitchen remodel prep", "fixture install request", "EV charger request"]
};

const categoryHiddenProblemMap: Record<string, string[]> = {
  outlet_issue: ["open grounds", "outdated wiring", "unsafe temporary repair"],
  surge_protection: ["no surge protection", "aging panel", "panel brand reliability concern"],
  panel_upgrade: ["aging panel", "double tapped breakers", "capacity limitation", "outdated wiring"],
  generator_backup: ["capacity limitation", "aging panel", "no dedicated circuit"],
  ev_charger: ["capacity limitation", "no dedicated circuit", "aging panel"],
  fixture_install: ["outdated wiring", "open grounds", "unsafe temporary repair"],
  breaker_issue: ["overloaded circuit", "double tapped breakers", "no dedicated circuit"],
  partial_power: ["aging panel", "panel brand reliability concern", "unsafe temporary repair"],
  gfci_issue: ["open grounds", "outdated wiring", "unsafe temporary repair"],
  remodel_prep: ["capacity limitation", "outdated wiring", "no dedicated circuit"]
};

const categoryMotivationMap: Record<string, string[]> = {
  outlet_issue: ["wants long-term peace of mind", "worried about family safety", "planning to sell home"],
  surge_protection: ["recent storm concern", "worried about family safety", "wants long-term peace of mind"],
  panel_upgrade: ["worried about family safety", "planning to sell home", "wants long-term peace of mind"],
  generator_backup: ["needs solution today", "recent storm concern", "wants long-term peace of mind"],
  ev_charger: ["needs solution today", "planning to sell home", "wants long-term peace of mind"],
  fixture_install: ["preparing for guests", "planning to sell home", "does not trust upsells"],
  breaker_issue: ["wants cheapest fix", "worried about family safety", "does not trust upsells"],
  partial_power: ["needs solution today", "worried about family safety", "recent storm concern"],
  gfci_issue: ["wants cheapest fix", "worried about family safety", "does not trust upsells"],
  remodel_prep: ["planning to sell home", "preparing for guests", "wants long-term peace of mind"]
};

const categoryObjectionMap: Record<string, string[]> = {
  outlet_issue: ["pushes back on price", "minimizes issue importance", "asks many clarification questions"],
  surge_protection: ["pushes back on price", "minimizes issue importance", "compares another quote"],
  panel_upgrade: ["pushes back on price", "needs spouse approval", "asks many clarification questions"],
  generator_backup: ["delays decision", "needs spouse approval", "compares another quote"],
  ev_charger: ["delays decision", "compares another quote", "pushes back on price"],
  fixture_install: ["minimizes issue importance", "pushes back on price", "delays decision"],
  breaker_issue: ["minimizes issue importance", "pushes back on price", "asks many clarification questions"],
  partial_power: ["asks many clarification questions", "needs spouse approval", "pushes back on price"],
  gfci_issue: ["minimizes issue importance", "pushes back on price", "asks many clarification questions"],
  remodel_prep: ["delays decision", "needs spouse approval", "compares another quote"]
};

const categoryBestPathMap: Record<string, string[]> = {
  outlet_issue: [
    "Acknowledge the small entry issue, then discover what else in the home has felt off.",
    "Connect outlet symptoms to grounding, wiring age, and broader safety confidence.",
    "Present a minimal repair, a safer corrective option, and a longer-term cleanup path."
  ],
  surge_protection: [
    "Tie the current nuisance issue to storm exposure, electronics risk, and protection gaps.",
    "Explain what could happen the next time the home takes a hit.",
    "Frame surge protection as a logical while-we-are-here upgrade, not a random add-on."
  ],
  panel_upgrade: [
    "Use the original complaint to uncover age, reliability, and future capacity concerns.",
    "Show why recurring symptoms point back to the panel or service equipment.",
    "Present cleanup, correction, and full upgrade paths with the recommended path clearly defined."
  ],
  generator_backup: [
    "Start with outage pain and what the homeowner could not do last time.",
    "Discover what absolutely has to work in the next outage.",
    "Position backup power as part of a broader reliability and readiness solution."
  ],
  ev_charger: [
    "Use the charger request to uncover what else the homeowner wants to add later.",
    "Educate around service capacity, panel room, and future electrical demand.",
    "Present a make-it-work option, a recommended infrastructure option, and a best future-ready option."
  ],
  fixture_install: [
    "Treat the install request as an opening to ask what shape the wiring and boxes are in.",
    "Discover whether convenience, resale, or safety upgrades make sense while access is easy.",
    "Present installation-only, corrective, and upgrade options."
  ],
  breaker_issue: [
    "Uncover what the breaker is feeding, what changed, and what else the homeowner wants to run later.",
    "Explain overload and shared-use consequences in plain language.",
    "Turn the breaker nuisance into a dedicated-circuit conversation with clear choices."
  ],
  partial_power: [
    "Use the urgency of partial power to justify a bigger reliability and safety conversation.",
    "Find out whether this has happened before and what equipment the homeowner is worried about.",
    "Move from diagnosis to a broader correction path when the evidence supports it."
  ],
  gfci_issue: [
    "Use the tripping device as an entry point into moisture, grounding, and wiring integrity.",
    "Find out whether this problem is isolated or part of a bigger safety picture.",
    "Present a small repair, a safer corrective path, and a best long-term protection option."
  ],
  remodel_prep: [
    "Discover the real project scope and what else the homeowner wants the space to support.",
    "Use timing and access to justify doing the larger electrical work once.",
    "Frame the upgrade path around convenience, resale, and avoiding costly rework later."
  ]
};

const categoryFailureMap: Record<string, string[]> = {
  outlet_issue: [
    "Fixing only the dead device without checking why the circuit got there.",
    "Talking repair before learning what else in the home feels unreliable."
  ],
  surge_protection: [
    "Treating surge protection like a random accessory instead of a consequence-based recommendation.",
    "Talking price before making risk feel real."
  ],
  panel_upgrade: [
    "Staying at the symptom level and never connecting the complaint to the panel condition.",
    "Presenting a full upgrade before earning trust through discovery."
  ],
  generator_backup: [
    "Talking equipment before learning what the homeowner actually needs during an outage.",
    "Skipping the emotional pain of recent outages."
  ],
  ev_charger: [
    "Installing for today without discussing tomorrow's electrical demand.",
    "Missing the chance to frame future-ready infrastructure."
  ],
  fixture_install: [
    "Treating the visit like install labor only.",
    "Missing the open-access opportunity for broader improvements."
  ],
  breaker_issue: [
    "Resetting or replacing without discovering what is on the circuit.",
    "Never presenting the dedicated-circuit solution as the professional answer."
  ],
  partial_power: [
    "Reducing a larger reliability issue to a one-line fix.",
    "Skipping consequence framing because the problem feels obvious."
  ],
  gfci_issue: [
    "Treating nuisance tripping like an annoyance instead of a safety clue.",
    "Leaving the homeowner with no broader understanding of risk."
  ],
  remodel_prep: [
    "Missing the best timing to expand scope before construction starts.",
    "Failing to ask what the homeowner wants the space to support later."
  ]
};

const openingScenarios: Record<string, string[]> = {
  "dead outlet": [
    "The outlet is why we called, but since you are here I also want to make sure there is not something bigger going on behind it.",
    "This dead outlet was the trigger, but honestly I am hoping you can tell me whether it points to a larger issue in this part of the house."
  ],
  "breaker tripping": [
    "The breaker keeps tripping, and I have a feeling this is turning into more than a simple nuisance.",
    "We called for the tripping breaker, but I really want to know whether this is a small fix or a sign the system is struggling."
  ],
  "flickering lights": [
    "The flickering lights are the reason for the call, but I would love an honest read on whether this points to something bigger.",
    "The lights have been acting up, and since you are already here I want to know if this is the kind of thing we should get ahead of."
  ],
  "fixture install request": [
    "We originally wanted the fixture installed, but while you are here I would rather know whether the wiring around it is really where it should be.",
    "The install is the immediate reason for the visit, but I do not want to miss a larger issue if the wiring is dated."
  ],
  "EV charger request": [
    "The charger is what got you here, but what I really need to know is whether this house is ready for everything we want to add.",
    "I am asking about the EV charger, but I suspect the bigger question is whether the panel can support our future plans."
  ],
  "generator backup question": [
    "We started with the generator question, but really I want to know how prepared this house is the next time we lose power.",
    "Backup power is the reason for the visit, but I am hoping you can tell me whether the electrical setup is ready for that kind of upgrade."
  ],
  "partial power loss": [
    "Part of the house lost power, and now I am wondering if this is one of those problems that points to something bigger.",
    "The partial power issue is what pushed me to call, but I do not want to keep fixing symptoms if there is a larger problem behind it."
  ],
  "bathroom GFCI issue": [
    "The bathroom outlet keeps acting up, and while you are here I want to know if it is just that device or something broader.",
    "We called because the GFCI will not behave, but I am hoping you can tell me if that points back to a bigger safety issue."
  ],
  "kitchen remodel prep": [
    "The remodel is what started the conversation, but I want to make sure we are not missing bigger electrical work while everything is open.",
    "We are talking kitchen plans, but I would rather find out now what bigger electrical work makes sense before we get too far."
  ],
  "exterior outlet failure": [
    "The outside outlet is the small problem, but if there is a larger issue tied to it I would rather know while you are here.",
    "We called because the exterior outlet quit, but I am open to hearing if it points to a broader issue worth taking care of."
  ]
};

const urgencyAddOns: Record<string, string[]> = {
  moderate: [
    "It is becoming regular enough that I do not want to keep patching small things and miss the bigger answer.",
    "It feels like the kind of problem that gets more expensive if we keep waiting."
  ],
  high: [
    "It has my attention now, and if there is a better long-term answer I would rather hear it while you are here.",
    "This stopped feeling like a minor annoyance, which is why I wanted someone out before it snowballs."
  ],
  immediate_same_day: [
    "I really wanted someone out today because if this points to bigger work I want to know now, not after another failure.",
    "Today is the day I decided I would rather deal with the real issue than keep dancing around the symptom."
  ]
};

const personalityAddOns: Record<string, string[]> = {
  budget_sensitive: [
    "I am open to the right work if it really solves something bigger, I just need to understand what is actually necessary.",
    "If you think there is a larger issue, walk me through why it matters before we talk money."
  ],
  trust_first: [
    "If you can explain it clearly, I am willing to hear what the bigger picture looks like.",
    "I mostly want an honest read on whether the small problem is attached to something more important."
  ],
  safety_motivated: [
    "My biggest concern is whether this is turning into a safety problem for the family.",
    "If this ties into a bigger safety issue, I would rather know that than just bandaid it."
  ],
  comparison_shopper: [
    "I do not mind hearing larger options, I just want to understand which one is actually the right fit.",
    "If there is a smarter fix while you are already here, I am willing to hear it as long as it makes sense."
  ],
  busy_homeowner: [
    "I do not have time to redo work twice, so if there is a bigger fix that should happen now I want the straight version.",
    "If we are going to handle it, I would rather handle the right scope once."
  ],
  skeptical_homeowner: [
    "I am cautious about anything sounding bigger than the original call, so I need you to connect the dots for me.",
    "If there is more going on, explain how you got there so it does not feel like a leap."
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

  const opener = pickBySeed(openingScenarios[scenario.visible_problem] || ["We called for a smaller issue, but I am open to understanding the larger picture if there is one."], seed);
  const urgency = pickBySeed(urgencyAddOns[scenario.urgency_level] || urgencyAddOns.high, seed, 1);
  const personality = pickBySeed(personalityAddOns[scenario.homeowner_personality] || personalityAddOns.trust_first, seed, 2);

  return [opener, urgency, personality].join(" ");
}

function buildBestPath(category: string | undefined) {
  const categoryPath = category ? categoryBestPathMap[category] : null;
  const path = categoryPath ?? [
    "Treat the visible issue as the doorway, not the whole job.",
    "Discover what else the homeowner wants to support, avoid, or solve while you are already in the home.",
    "Present three options that move from symptom relief to the full professional solution."
  ];

  return [
    "Build trust and slow down before jumping to a fix.",
    `Cover discovery topics: ${defaultDiscoveryTopics.join(", ")}.`,
    ...path,
    "Ask a commitment question tied to doing the right work while you are already onsite."
  ];
}

function buildFailureConditions(category: string | undefined) {
  const categoryFailures = category ? categoryFailureMap[category] : null;
  const failures = categoryFailures ?? [
    "Treating the visible issue like the whole job.",
    "Skipping future-plan discovery.",
    "Talking price before consequence and value are clear."
  ];

  return [
    ...failures,
    "Presenting only one option.",
    "Ending without a commitment question."
  ];
}

function scenarioTitle(visibleProblem: string, category: string | undefined, neighborhoodType: string | null) {
  const track = targetedPracticeTracks.find((item) => item.category === category);
  if (track) {
    return `${track.label} from ${titleCase(visibleProblem)}`;
  }

  return `${titleCase(visibleProblem)} in ${neighborhoodType ?? "Metro Detroit suburb"}`;
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

  const selectedHiddenProblems = input.mode === "targeted" && input.category
    ? categoryHiddenProblemMap[input.category] ?? hiddenProblems
    : hiddenProblems;
  const selectedMotivations = input.mode === "targeted" && input.category
    ? categoryMotivationMap[input.category] ?? hiddenMotivations
    : hiddenMotivations;
  const selectedObjections = input.mode === "targeted" && input.category
    ? categoryObjectionMap[input.category] ?? objectionStyles
    : objectionStyles;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const scenario: GeneratedScenario = {
      scenario_title: "",
      visible_problem: randomItem(selectedVisibleProblems),
      hidden_problem: randomItem(selectedHiddenProblems),
      homeowner_personality: randomItem(homeownerPersonalities),
      hidden_motivation: randomItem(selectedMotivations),
      objection_style: randomItem(selectedObjections),
      urgency_level: randomItem(urgencyLevels),
      expected_best_path: buildBestPath(input.category),
      failure_conditions: buildFailureConditions(input.category),
      opening_homeowner_message: "",
      home_age_range: randomItem(["1940s-1960s", "1970s-1990s", "2000s+", "mixed-era home"]),
      neighborhood_type: randomItem(["inner-ring suburb", "growing subdivision", "older established neighborhood"]),
      spouse_involved: Math.random() > 0.55,
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

    scenario.scenario_title = scenarioTitle(scenario.visible_problem, input.category, scenario.neighborhood_type);
    scenario.opening_homeowner_message = openingMessage(scenario);
    return scenario;
  }

  const fallbackVisible = selectedVisibleProblems[0] ?? visibleProblems[0];
  const fallbackScenario: GeneratedScenario = {
    scenario_title: scenarioTitle(fallbackVisible, input.category, "older established neighborhood"),
    visible_problem: fallbackVisible,
    hidden_problem: selectedHiddenProblems[0] ?? hiddenProblems[0],
    homeowner_personality: homeownerPersonalities[0],
    hidden_motivation: selectedMotivations[0] ?? hiddenMotivations[0],
    objection_style: selectedObjections[0] ?? objectionStyles[0],
    urgency_level: urgencyLevels[0],
    expected_best_path: buildBestPath(input.category),
    failure_conditions: buildFailureConditions(input.category),
    opening_homeowner_message: "",
    home_age_range: "1970s-1990s",
    neighborhood_type: "older established neighborhood",
    spouse_involved: false,
    prior_contractor_seen: false
  };

  fallbackScenario.opening_homeowner_message = openingMessage(fallbackScenario);
  return fallbackScenario;
}

export const targetedPracticeTracks = [
  {
    category: "panel_upgrade",
    label: "Panel Safety Expansion",
    shortLabel: "Panel Safety",
    detail: "Train the tech to turn a smaller service call into a deeper panel safety conversation with options.",
    businessGoal: "Expand a small repair into panel correction, cleanup, or upgrade work.",
    coachingFocus: "Discovery around safety, age, future plans, and whether the panel is still serving the home well.",
    entryProblems: ["breaker tripping", "flickering lights", "partial power loss"]
  },
  {
    category: "surge_protection",
    label: "Whole-Home Protection",
    shortLabel: "Surge Protection",
    detail: "Train the tech to uncover risk and position surge protection while already onsite for another problem.",
    businessGoal: "Raise ticket value through protection, risk education, and future-failure framing.",
    coachingFocus: "Storm history, electronics in the home, nuisance failures, and why protection matters before the next event.",
    entryProblems: ["breaker tripping", "partial power loss", "exterior outlet failure"]
  },
  {
    category: "breaker_issue",
    label: "Overload to Dedicated Circuit",
    shortLabel: "Dedicated Circuit",
    detail: "Train the tech to move from a nuisance breaker complaint into dedicated circuit and capacity work.",
    businessGoal: "Convert recurring breaker complaints into circuit separation and capacity solutions.",
    coachingFocus: "What is running on the circuit, what changed lately, and what the homeowner wants to add later.",
    entryProblems: ["breaker tripping", "bathroom GFCI issue", "dead outlet"]
  },
  {
    category: "ev_charger",
    label: "Future Capacity Conversation",
    shortLabel: "Future Capacity",
    detail: "Train the tech to turn EV or lifestyle planning into larger capacity and panel recommendations.",
    businessGoal: "Grow the job beyond the immediate ask into load management or service upgrade work.",
    coachingFocus: "Timeline, staying in the home, other electrical upgrades, and whether the service can support future demand.",
    entryProblems: ["EV charger request", "kitchen remodel prep", "generator backup question"]
  },
  {
    category: "remodel_prep",
    label: "Remodel Scope Expansion",
    shortLabel: "Remodel Prep",
    detail: "Train the tech to uncover hidden electrical scope before walls open or fixtures get installed.",
    businessGoal: "Move from simple install talk into broader remodel electrical planning and upgrades.",
    coachingFocus: "Appliance plans, timeline, resale goals, convenience upgrades, and what needs to be done while access is easy.",
    entryProblems: ["kitchen remodel prep", "fixture install request", "dead outlet"]
  },
  {
    category: "generator_backup",
    label: "Backup Power and Reliability",
    shortLabel: "Backup Power",
    detail: "Train the tech to tie outages and reliability concerns into larger backup or service improvement work.",
    businessGoal: "Position generator, load management, and service readiness work from real homeowner pain.",
    coachingFocus: "Outage pain, what the homeowner could not run, family disruption, and what reliability is worth to them.",
    entryProblems: ["generator backup question", "partial power loss", "flickering lights"]
  }
] as const;

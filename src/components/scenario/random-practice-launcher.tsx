"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const difficultyOptions = [
  { value: "guided_mode", label: "Guided Mode", detail: "Hints during the conversation." },
  { value: "field_mode", label: "Field Mode", detail: "Coach feedback after the scenario." },
  { value: "ride_along_mode", label: "Ride-Along Mode", detail: "Score only after the session ends." }
] as const;

const coachOptions = [
  { value: "off", label: "Coach Off" },
  { value: "light", label: "Coach Light" },
  { value: "full", label: "Coach Full" }
] as const;

export function RandomPracticeLauncher() {
  const router = useRouter();
  const [difficultyMode, setDifficultyMode] = useState<(typeof difficultyOptions)[number]["value"]>("guided_mode");
  const [coachMode, setCoachMode] = useState<(typeof coachOptions)[number]["value"]>("light");
  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  async function launchScenario() {
    setError(null);
    setIsLaunching(true);

    try {
      const response = await fetch("/api/scenarios/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "random",
          difficulty_mode: difficultyMode,
          coach_mode: coachMode
        })
      });

      const payload = (await response.json()) as { error?: string; scenario_session_id?: string };
      if (!response.ok || !payload.scenario_session_id) {
        setError(payload.error ?? "Unable to start a scenario right now.");
        return;
      }

      router.push(`/scenario/${payload.scenario_session_id}`);
      router.refresh();
    } catch {
      setError("Unable to start a scenario right now.");
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <main className="space-y-6">
      <Card className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Random Practice</p>
        <h1 className="text-3xl font-semibold">Launch a fresh homeowner scenario</h1>
        <p className="text-sm text-slate">
          Every session is generated from a new combination of visible problem, hidden issue, homeowner personality,
          motivation, objection style, and urgency.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Difficulty</p>
          <div className="grid gap-3">
            {difficultyOptions.map((option) => {
              const active = option.value == difficultyMode;
              return (
                <button
                  key={option.value}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active ? "border-ink bg-ink text-white" : "border-slate/10 bg-mist text-ink hover:border-slate/30"
                  }`}
                  onClick={() => setDifficultyMode(option.value)}
                  type="button"
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className={`mt-1 text-sm ${active ? "text-white/80" : "text-slate"}`}>{option.detail}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Coach Mode</p>
          <div className="flex flex-wrap gap-2">
            {coachOptions.map((option) => {
              const active = option.value == coachMode;
              return (
                <button
                  key={option.value}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-ink text-white" : "bg-mist text-slate hover:bg-white"
                  }`}
                  onClick={() => setCoachMode(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-mist p-4 text-sm text-slate">
            <p className="font-semibold text-ink">Current setup</p>
            <p className="mt-2">Difficulty: {difficultyOptions.find((option) => option.value === difficultyMode)?.label}</p>
            <p>Coach: {coachOptions.find((option) => option.value === coachMode)?.label}</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLaunching} onClick={launchScenario} type="button">
            {isLaunching ? "Starting scenario..." : "Start Training"}
          </Button>
        </Card>
      </div>
    </main>
  );
}

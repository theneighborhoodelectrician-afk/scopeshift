"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { targetedPracticeTracks } from "@/lib/constants/targeted-practice-tracks";
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

export function TargetedPracticeLauncher() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<(typeof targetedPracticeTracks)[number]["category"]>(targetedPracticeTracks[0].category);
  const [difficultyMode, setDifficultyMode] = useState<(typeof difficultyOptions)[number]["value"]>("guided_mode");
  const [coachMode, setCoachMode] = useState<(typeof coachOptions)[number]["value"]>("light");
  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedTrack = useMemo(
    () => targetedPracticeTracks.find((track) => track.category === selectedCategory) ?? targetedPracticeTracks[0],
    [selectedCategory]
  );

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
          mode: "targeted",
          category: selectedCategory,
          difficulty_mode: difficultyMode,
          coach_mode: coachMode
        })
      });

      const payload = (await response.json()) as { error?: string; scenario_session_id?: string };
      if (response.ok === false || payload.scenario_session_id == null) {
        setError(payload.error ?? "Unable to start targeted practice right now.");
        return;
      }

      router.push(`/scenario/${payload.scenario_session_id}`);
      router.refresh();
    } catch {
      setError("Unable to start targeted practice right now.");
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <main className="space-y-6">
      <Card className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Targeted Practice</p>
        <h1 className="text-3xl font-semibold">Train the bigger conversation, not the tiny repair</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate">
          These reps start with a real service-call entry issue, but the real goal is uncovering the larger justified solution,
          presenting structured options, and raising ticket value through discovery and education.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Growth Tracks</p>
          <div className="grid gap-4 md:grid-cols-2">
            {targetedPracticeTracks.map((track) => {
              const active = track.category === selectedCategory;
              return (
                <button
                  key={track.category}
                  className={`rounded-[1.8rem] border p-5 text-left transition ${
                    active ? "border-ink bg-ink text-white shadow-panel" : "border-white/70 bg-white/90 text-ink hover:border-slate/20 hover:bg-white"
                  }`}
                  onClick={() => setSelectedCategory(track.category)}
                  type="button"
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${active ? "text-amber-300" : "text-ember"}`}>{track.shortLabel}</p>
                  <h2 className="mt-3 text-xl font-semibold">{track.label}</h2>
                  <p className={`mt-3 text-sm leading-6 ${active ? "text-white/80" : "text-slate"}`}>{track.detail}</p>
                  <p className={`mt-4 text-sm ${active ? "text-white/75" : "text-slate"}`}>Entry issues: {track.entryProblems.join(", ")}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Selected Focus</p>
            <h2 className="text-2xl font-semibold text-ink">{selectedTrack.label}</h2>
            <div className="space-y-4 text-sm leading-6 text-slate">
              <div>
                <p className="font-semibold text-ink">Business goal</p>
                <p>{selectedTrack.businessGoal}</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Coach emphasis</p>
                <p>{selectedTrack.coachingFocus}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Difficulty</p>
            <div className="grid gap-3">
              {difficultyOptions.map((option) => {
                const active = option.value === difficultyMode;
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
                const active = option.value === coachMode;
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
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={isLaunching} onClick={launchScenario} type="button">
              {isLaunching ? "Starting targeted rep..." : "Start Targeted Practice"}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}

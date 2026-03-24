import { Card } from "@/components/ui/card";

const labels: Record<string, string> = {
  rapport_score: "Rapport",
  discovery_score: "Discovery",
  risk_explanation_score: "Risk Explanation",
  education_score: "Education",
  options_score: "Options",
  commitment_score: "Commitment",
  overall_score: "Overall"
};

export function Scorecard({ scores }: { scores: Record<string, number> }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Scorecard</p>
        <h3 className="mt-2 text-2xl font-semibold text-ink">Scenario Results</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-mist p-4">
            <p className="text-sm font-medium text-slate">{labels[key] ?? key.replaceAll("_", " ")}</p>
            <p className="mt-1 text-3xl font-semibold text-ink">{value}<span className="text-base text-slate">/10</span></p>
          </div>
        ))}
      </div>
    </Card>
  );
}

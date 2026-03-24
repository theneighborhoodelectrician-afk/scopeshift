import { Card } from "@/components/ui/card";

export function Scorecard({ scores }: { scores: Record<string, number> }) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Scorecard</p>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-mist p-4">
            <p className="text-sm font-medium text-slate">{key.replaceAll("_", " ")}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

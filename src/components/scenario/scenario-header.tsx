import { Card } from "@/components/ui/card";

export function ScenarioHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Live Scenario</p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate">{subtitle}</p>
      </div>
    </Card>
  );
}

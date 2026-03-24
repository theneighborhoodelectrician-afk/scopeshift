import { Card } from "@/components/ui/card";

export function ScenarioCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Scenario</p>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-slate">{detail}</p>
    </Card>
  );
}

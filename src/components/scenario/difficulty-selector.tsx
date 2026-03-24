import { Card } from "@/components/ui/card";

export function DifficultySelector() {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Difficulty</p>
      <div className="flex flex-wrap gap-2 text-sm text-slate">
        <span className="rounded-full bg-mist px-3 py-2">guided_mode</span>
        <span className="rounded-full bg-mist px-3 py-2">field_mode</span>
        <span className="rounded-full bg-mist px-3 py-2">ride_along_mode</span>
      </div>
    </Card>
  );
}

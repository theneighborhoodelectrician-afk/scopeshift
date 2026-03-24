import { Card } from "@/components/ui/card";

export function CoachModeToggle() {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Coach Mode</p>
      <div className="flex gap-2 text-sm text-slate">
        <span className="rounded-full bg-mist px-3 py-2">off</span>
        <span className="rounded-full bg-mist px-3 py-2">light</span>
        <span className="rounded-full bg-mist px-3 py-2">full</span>
      </div>
    </Card>
  );
}

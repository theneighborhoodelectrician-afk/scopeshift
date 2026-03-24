import { Card } from "@/components/ui/card";

export function CoachHintPanel({ hint }: { hint: string | null }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Coach Hint</p>
      <p className="mt-2 text-sm text-slate">{hint ?? "Coach mode is currently off for this session."}</p>
    </Card>
  );
}

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Card className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {helper ? <p className="text-sm text-slate">{helper}</p> : null}
    </Card>
  );
}

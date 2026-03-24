import { Card } from "@/components/ui/card";

type ProgressChartProps = {
  values: number[];
};

export function ProgressChart({ values }: ProgressChartProps) {
  const chartValues = values.length ? values : [0, 0, 0, 0];
  const hasData = values.some((value) => value > 0);

  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Progress</p>
      <div className="grid grid-cols-4 gap-3">
        {chartValues.map((value, index) => (
          <div key={index} className="flex h-36 items-end rounded-2xl bg-mist p-3">
            <div
              className="w-full rounded-full bg-pine transition-all"
              style={{ height: `${Math.max(value, 8) * 10}%`, opacity: hasData ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-slate">
        {hasData
          ? "Your four most recent overall scores. Watch these bars climb as your discovery and option presentation improve."
          : "Once you complete scenarios, your recent overall scores will appear here."}
      </p>
    </Card>
  );
}

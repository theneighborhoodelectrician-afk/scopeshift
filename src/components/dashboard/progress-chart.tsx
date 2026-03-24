import { Card } from "@/components/ui/card";

export function ProgressChart() {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Progress</p>
      <div className="grid grid-cols-4 gap-3">
        {[5, 6, 7, 8].map((value, index) => (
          <div key={index} className="flex h-36 items-end rounded-2xl bg-mist p-3">
            <div className="w-full rounded-full bg-pine" style={{ height: `${value * 10}%` }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

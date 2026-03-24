import { Card } from "@/components/ui/card";

export function LeaderboardTable() {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Leaderboard</p>
      <div className="mt-4 space-y-3 text-sm text-slate">
        <div className="flex justify-between rounded-2xl bg-mist p-3"><span>Alex R.</span><span>8.6</span></div>
        <div className="flex justify-between rounded-2xl bg-mist p-3"><span>Jordan M.</span><span>8.1</span></div>
      </div>
    </Card>
  );
}

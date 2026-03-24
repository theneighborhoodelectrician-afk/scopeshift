import { Card } from "@/components/ui/card";

export function RecentSessionsTable() {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Recent Sessions</p>
      <div className="mt-4 space-y-3 text-sm text-slate">
        <div className="flex justify-between rounded-2xl bg-mist p-3"><span>Breaker Tripping Scope Expand</span><span>7/10</span></div>
        <div className="flex justify-between rounded-2xl bg-mist p-3"><span>Remodel Prep Capacity Conversation</span><span>8/10</span></div>
      </div>
    </Card>
  );
}

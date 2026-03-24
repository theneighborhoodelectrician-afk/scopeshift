import { Card } from "@/components/ui/card";

type SessionRow = {
  id: string;
  scenarioTitle: string;
  createdAt: Date;
  overallScore: number | null;
  status: string;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(value);
}

export function RecentSessionsTable({ sessions }: { sessions: SessionRow[] }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Recent Sessions</p>

      {sessions.length ? (
        <div className="mt-4 space-y-3 text-sm text-slate">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-2xl bg-mist p-3">
              <div>
                <p className="font-medium text-ink">{session.scenarioTitle}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate/80">
                  {session.status} · {formatDate(session.createdAt)}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">
                {session.overallScore === null ? "In progress" : `${session.overallScore}/10`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate">
          No practice sessions yet. Start a scenario to see your recent scores and completions here.
        </p>
      )}
    </Card>
  );
}

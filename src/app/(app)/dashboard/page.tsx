import Link from "next/link";
import { redirect } from "next/navigation";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ScenarioCard } from "@/components/scenario/scenario-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatAverage(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  return `${numericValue.toFixed(1)}/10`;
}

export default async function DashboardPage() {
  const { user } = await requireUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const [progress, recentSessions] = await Promise.all([
      prisma.userProgress.findUnique({ where: { userId: user.id } }),
      prisma.scenarioSession.findMany({
        where: { userId: user.id },
        include: { score: true },
        orderBy: { createdAt: "desc" },
        take: 4
      })
    ]);

    const sessions = recentSessions.map((session) => ({
      id: session.id,
      scenarioTitle: session.scenarioTitle,
      createdAt: session.createdAt,
      overallScore: session.score?.overallScore ?? null,
      status: session.status.replaceAll("_", " ")
    }));

    const recentScores = sessions.map((session) => session.overallScore ?? 0).reverse();
    const firstName = user.firstName?.trim() || "Technician";
    const totalSessions = progress?.totalSessions ?? 0;
    const completedSessions = progress?.completedSessions ?? 0;
    const averageOverall = formatAverage(progress?.avgOverallScore?.toString());
    const currentStreak = progress?.currentStreak ?? 0;

    return (
      <main className="space-y-6">
        <ScenarioCard
          title={`Welcome back, ${firstName}`}
          detail={
            totalSessions
              ? `You have completed ${completedSessions} sessions and you are currently averaging ${averageOverall}. Keep building confidence through discovery, education, and clear options.`
              : "Your training account is ready. Start your first scenario to build your score history, streak, and coaching insights."
          }
        />

        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Start Training</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Jump into your next rep</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              Launch a fresh random scenario or head to focused practice so you can keep building momentum without leaving the dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/practice/random"><Button className="bg-ember hover:bg-[#a75614]">Start Random Practice</Button></Link>
            <Link href="/practice"><Button className="bg-ink hover:bg-slate">View Practice Modes</Button></Link>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Completed Sessions" value={completedSessions} helper="Finished role-plays scored and saved to your progress." />
          <StatCard label="Average Score" value={averageOverall} helper="Your overall average across completed scenarios." />
          <StatCard label="Current Streak" value={currentStreak} helper="Consecutive completed practice sessions." />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ProgressChart values={recentScores} />
          <RecentSessionsTable sessions={sessions} />
        </section>
      </main>
    );
  } catch {
    return (
      <main className="space-y-6">
        <ScenarioCard
          title="Dashboard temporarily unavailable"
          detail="We could not load your progress just now. Refresh the page or restart the dev server and try again."
        />
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Start Training</p>
            <p className="mt-2 text-sm leading-6 text-slate">You can still jump into a fresh scenario while the dashboard catches up.</p>
          </div>
          <Link href="/practice/random"><Button className="bg-ember hover:bg-[#a75614]">Start Random Practice</Button></Link>
        </Card>
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Completed Sessions" value={0} helper="Unable to load current data." />
          <StatCard label="Average Score" value="0.0/10" helper="Unable to load current data." />
          <StatCard label="Current Streak" value={0} helper="Unable to load current data." />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ProgressChart values={[]} />
          <RecentSessionsTable sessions={[]} />
        </section>
      </main>
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "manager", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.teamId) {
    return NextResponse.json({
      team_average: 0,
      weakest_categories: ["discovery_score", "commitment_score"],
      strongest_categories: ["education_score"],
      leaderboard: [],
      recent_completion_counts: 0
    });
  }

  const teamSessions = await prisma.scenarioSession.findMany({
    where: { teamId: user.teamId, status: "completed" },
    include: { score: true },
    orderBy: { completedAt: "desc" },
    take: 50
  });

  const overallScores = teamSessions
    .map((session) => session.score?.overallScore)
    .filter((value): value is number => typeof value === "number");

  return NextResponse.json({
    team_average: Number(average(overallScores).toFixed(2)),
    weakest_categories: ["discovery_score", "commitment_score"],
    strongest_categories: ["education_score"],
    leaderboard: [],
    recent_completion_counts: teamSessions.length
  });
}

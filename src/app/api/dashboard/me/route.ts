import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await prisma.userProgress.findUnique({ where: { userId: user.id } });
  const recentSessions = await prisma.scenarioSession.findMany({
    where: { userId: user.id },
    include: { score: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return NextResponse.json({
    total_sessions: progress?.totalSessions ?? 0,
    average_scores: progress,
    streak: progress?.currentStreak ?? 0,
    recent_sessions: recentSessions,
    improvement_trends: []
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.teamId) return NextResponse.json([]);

  const entries = await prisma.leaderboardEntry.findMany({
    where: { teamId: user.teamId },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { averageScore: "desc" },
    take: 20
  });

  return NextResponse.json(entries);
}

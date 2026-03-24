import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.teamId) return NextResponse.json(null);

  const team = await prisma.team.findUnique({ where: { id: user.teamId } });
  return NextResponse.json(team);
}

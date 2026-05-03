import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "manager", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.teamId) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: { teamId: user.teamId },
    include: { progress: true }
  });

  return NextResponse.json(users);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.scenarioSession.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await prisma.scenarioSession.update({
    where: { id: existing.id },
    data: { status: "active", startedAt: new Date() }
  });

  return NextResponse.json(session);
}

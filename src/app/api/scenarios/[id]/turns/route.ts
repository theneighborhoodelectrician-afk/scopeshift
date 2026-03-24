import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const turns = await prisma.scenarioTurn.findMany({
    where: { scenarioSessionId: id, scenarioSession: { userId: user.id } },
    orderBy: { turnIndex: "asc" }
  });

  return NextResponse.json(turns);
}

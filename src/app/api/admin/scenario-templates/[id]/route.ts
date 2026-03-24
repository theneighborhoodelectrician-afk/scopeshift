import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "manager", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = await params;
  const template = await prisma.scenarioTemplate.update({ where: { id }, data: body });
  return NextResponse.json(template);
}

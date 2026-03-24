import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.organizationId) return NextResponse.json(null);

  const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });
  return NextResponse.json(organization);
}

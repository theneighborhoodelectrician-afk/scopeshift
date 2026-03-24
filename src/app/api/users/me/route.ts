import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: body.first_name ?? user.firstName,
      lastName: body.last_name ?? user.lastName
    }
  });

  return NextResponse.json(updated);
}

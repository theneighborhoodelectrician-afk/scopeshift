import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, toAuthResponse } from "@/lib/auth";
import { signupSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = signupSchema.parse(await request.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      passwordHash,
      role: "technician"
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      teamId: true
    }
  });

  await prisma.userProgress.create({ data: { userId: user.id } });
  await createSession(user.id);

  return NextResponse.json(toAuthResponse(user), { status: 201 });
}

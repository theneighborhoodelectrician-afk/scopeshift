import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, toAuthResponse, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = loginSchema.parse(await request.json());
  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      teamId: true,
      passwordHash: true
    }
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id);

  const { passwordHash: _passwordHash, ...sessionUser } = user;
  return NextResponse.json(toAuthResponse(sessionUser));
}

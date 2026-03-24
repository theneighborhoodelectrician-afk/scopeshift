import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/types/auth";

const COOKIE_NAME = "scopeshift_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

function signPayload(payload: string) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const signed = `${payload}.${signPayload(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const [userId, issuedAt, signature] = token.split(".");
  if (!userId || !issuedAt || !signature) {
    return null;
  }

  const payload = `${userId}.${issuedAt}`;
  if (signPayload(payload) !== signature) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
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
}

export async function requireUser(): Promise<{
  user: SessionUser | null;
  error: NextResponse | null;
}> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { user, error: null };
}

export function toAuthResponse(user: SessionUser) {
  return { user };
}

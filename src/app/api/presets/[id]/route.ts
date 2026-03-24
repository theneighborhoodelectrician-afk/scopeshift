import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { presetSchema } from "@/lib/validation/presets";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = presetSchema.parse(await request.json());
  const { id } = await params;
  const existing = await prisma.practicePreset.findFirst({ where: { id, createdByUserId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const preset = await prisma.practicePreset.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      category: body.category ?? null,
      difficultyMode: body.difficulty_mode,
      coachMode: body.coach_mode
    }
  });

  return NextResponse.json(preset);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.practicePreset.findFirst({ where: { id, createdByUserId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.practicePreset.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

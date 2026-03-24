import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { presetSchema } from "@/lib/validation/presets";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const presets = await prisma.practicePreset.findMany({ where: { createdByUserId: user.id } });
  return NextResponse.json(presets);
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = presetSchema.parse(await request.json());
  const preset = await prisma.practicePreset.create({
    data: {
      organizationId: user.organizationId,
      createdByUserId: user.id,
      name: body.name,
      category: body.category ?? null,
      difficultyMode: body.difficulty_mode,
      coachMode: body.coach_mode,
      enabledVisibleProblems: [],
      enabledHiddenProblems: [],
      enabledPersonalities: [],
      enabledMotivations: [],
      enabledObjectionStyles: []
    }
  });

  return NextResponse.json(preset, { status: 201 });
}

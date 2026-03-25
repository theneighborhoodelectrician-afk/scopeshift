import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { analyzeTurn } from "@/lib/scoring/detection";
import { generateLiveCoachHint } from "@/lib/ai/generate-live-coach-hint";

const allowedSpeakers = new Set(['technician', 'homeowner']);

type VoiceTurnPayload = {
  speaker: 'technician' | 'homeowner';
  messageText: string;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (user == null) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as Partial<VoiceTurnPayload>;
  if (body.speaker == null || allowedSpeakers.has(body.speaker) === false) {
    return NextResponse.json({ error: 'Invalid speaker.' }, { status: 400 });
  }

  const messageText = body.messageText?.trim() ?? '';
  if (messageText === '') {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
  }

  const { id } = await params;
  const session = await prisma.scenarioSession.findFirst({
    where: { id, userId: user.id },
    include: { turns: { orderBy: { turnIndex: 'asc' } } }
  });

  if (session == null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (session.status === 'completed' || session.status === 'abandoned') {
    return NextResponse.json({ error: 'Scenario is no longer active.' }, { status: 409 });
  }

  const lastTurn = session.turns[session.turns.length - 1];
  if (lastTurn && lastTurn.speaker === body.speaker && lastTurn.messageText === messageText) {
    return NextResponse.json({ coach_hint: null, duplicated: true });
  }

  const nextIndex = session.turns.length;
  const analysis = body.speaker === 'technician' ? analyzeTurn(messageText) : null;

  await prisma.scenarioTurn.create({
    data: {
      scenarioSessionId: session.id,
      turnIndex: nextIndex,
      speaker: body.speaker,
      messageText,
      metadataJson: analysis ?? { response_source: 'realtime_voice' }
    }
  });

  let coachHint: string | null = null;
  if (body.speaker === 'technician') {
    coachHint = await generateLiveCoachHint({
      technicianMessage: messageText,
      coachMode: session.coachMode
    });

    if (coachHint) {
      await prisma.scenarioTurn.create({
        data: {
          scenarioSessionId: session.id,
          turnIndex: nextIndex + 1,
          speaker: 'coach',
          messageText: coachHint,
          metadataJson: { coaching_hint_type: session.coachMode, source: 'realtime_voice' }
        }
      });
    }
  }

  if (session.status === 'created') {
    await prisma.scenarioSession.update({
      where: { id: session.id },
      data: { status: 'active', startedAt: session.startedAt ?? new Date() }
    });
  }

  return NextResponse.json({ coach_hint: coachHint });
}

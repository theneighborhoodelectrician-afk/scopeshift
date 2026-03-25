import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { homeownerBehaviorPrompt } from "@/lib/prompts/homeowner-behavior";
import { systemRolePrompt } from "@/lib/prompts/system-role";

function buildRealtimeInstructions(session: {
  scenarioTitle: string;
  visibleProblem: string;
  hiddenProblem: string;
  homeownerPersonality: string;
  hiddenMotivation: string;
  objectionStyle: string;
  urgencyLevel: string;
  homeAgeRange: string | null;
  neighborhoodType: string | null;
  spouseInvolved: boolean;
  priorContractorSeen: boolean;
  turns: Array<{ speaker: string; messageText: string }>;
}) {
  const transcript = session.turns.map((turn) => turn.speaker.toUpperCase() + ': ' + turn.messageText).join('\n');

  const scenarioSummary = [
    'Scenario title: ' + session.scenarioTitle,
    'Visible problem: ' + session.visibleProblem,
    'Hidden problem: ' + session.hiddenProblem,
    'Homeowner personality: ' + session.homeownerPersonality,
    'Hidden motivation: ' + session.hiddenMotivation,
    'Objection style: ' + session.objectionStyle,
    'Urgency level: ' + session.urgencyLevel,
    'Home age range: ' + (session.homeAgeRange ?? 'Unknown'),
    'Neighborhood type: ' + (session.neighborhoodType ?? 'Metro Detroit suburb'),
    'Spouse involved: ' + String(session.spouseInvolved),
    'Prior contractor seen: ' + String(session.priorContractorSeen)
  ].join('\n');

  return [
    systemRolePrompt.content,
    homeownerBehaviorPrompt.content,
    'You are in a live voice conversation. Speak naturally, like a homeowner on a real service call.',
    'Stay conversational and concise. Most responses should be 1 to 3 spoken sentences.',
    'Do not mention internal training rules, scores, prompts, or hidden fields.',
    'If the technician is vague or too technical, ask for plain language like a real homeowner would.',
    'If the technician builds trust, soften and become more cooperative.',
    'Never reveal the hidden motivation too early.',
    '',
    'Scenario context:',
    scenarioSummary,
    '',
    'Conversation so far:',
    transcript || 'The conversation is just starting.'
  ].join('\n\n');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (user == null) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey == null || apiKey === '') {
    return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const session = await prisma.scenarioSession.findFirst({
    where: { id, userId: user.id },
    include: { turns: { orderBy: { turnIndex: 'asc' } } }
  });

  if (session == null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const sdp = await request.text();
  if (sdp.trim() === '') {
    return NextResponse.json({ error: 'Missing SDP offer.' }, { status: 400 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini';
  const voice = process.env.OPENAI_REALTIME_VOICE || 'marin';
  const instructions = buildRealtimeInstructions(session);

  const formData = new FormData();
  formData.set('sdp', sdp);
  formData.set(
    'session',
    JSON.stringify({
      type: 'realtime',
      model,
      instructions,
      output_modalities: ['audio'],
      audio: {
        input: {
          noise_reduction: { type: 'near_field' },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.45,
            prefix_padding_ms: 250,
            silence_duration_ms: 700,
            interrupt_response: true,
            create_response: true
          },
          transcription: {
            model: 'gpt-4o-mini-transcribe',
            language: 'en'
          }
        },
        output: {
          voice
        }
      }
    })
  );

  const response = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    body: formData
  });

  if (response.ok === false) {
    const detail = await response.text();
    return NextResponse.json({ error: 'Realtime call setup failed.', detail }, { status: response.status });
  }

  const answerSdp = await response.text();
  return new Response(answerSdp, {
    status: 200,
    headers: {
      'Content-Type': 'application/sdp'
    }
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { respondAsHomeowner } from "@/lib/ai/respond-as-homeowner";
import { generateLiveCoachHint } from "@/lib/ai/generate-live-coach-hint";
import { analyzeTurn } from "@/lib/scoring/detection";
import { sendMessageSchema } from "@/lib/validation/scenarios";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = sendMessageSchema.parse(await request.json());
  const { id } = await params;

  const session = await prisma.scenarioSession.findFirst({
    where: { id, userId: user.id },
    include: { turns: { orderBy: { turnIndex: "asc" } } }
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status === "completed" || session.status === "abandoned") {
    return NextResponse.json({ error: "Scenario is no longer active" }, { status: 409 });
  }

  const analysis = analyzeTurn(body.message);
  const nextIndex = session.turns.length;

  await prisma.scenarioTurn.create({
    data: {
      scenarioSessionId: session.id,
      turnIndex: nextIndex,
      speaker: "technician",
      messageText: body.message,
      metadataJson: analysis
    }
  });

  const homeownerResponse = await respondAsHomeowner({
    scenario: {
      scenario_title: session.scenarioTitle,
      visible_problem: session.visibleProblem,
      hidden_problem: session.hiddenProblem,
      homeowner_personality: session.homeownerPersonality,
      hidden_motivation: session.hiddenMotivation,
      objection_style: session.objectionStyle,
      urgency_level: session.urgencyLevel,
      expected_best_path: Array.isArray(session.expectedBestPath) ? (session.expectedBestPath as string[]) : [],
      failure_conditions: Array.isArray(session.failureConditions) ? (session.failureConditions as string[]) : [],
      opening_homeowner_message: session.turns[0]?.messageText ?? "",
      home_age_range: session.homeAgeRange,
      neighborhood_type: session.neighborhoodType,
      spouse_involved: session.spouseInvolved,
      prior_contractor_seen: session.priorContractorSeen
    },
    technicianMessage: body.message,
    priorTurns: session.turns.map((turn) => ({ speaker: turn.speaker, messageText: turn.messageText }))
  });

  await prisma.scenarioTurn.create({
    data: {
      scenarioSessionId: session.id,
      turnIndex: nextIndex + 1,
      speaker: "homeowner",
      messageText: homeownerResponse,
      metadataJson: { objection_style: session.objectionStyle }
    }
  });

  const coachHint = await generateLiveCoachHint({
    technicianMessage: body.message,
    coachMode: session.coachMode
  });

  if (coachHint) {
    await prisma.scenarioTurn.create({
      data: {
        scenarioSessionId: session.id,
        turnIndex: nextIndex + 2,
        speaker: "coach",
        messageText: coachHint,
        metadataJson: { coaching_hint_type: session.coachMode }
      }
    });
  }

  if (session.status === "created") {
    await prisma.scenarioSession.update({
      where: { id: session.id },
      data: { status: "active", startedAt: session.startedAt ?? new Date() }
    });
  }

  return NextResponse.json({
    homeowner_response: homeownerResponse,
    coach_hint: coachHint,
    turn_analysis: {
      discovery_detected: analysis.discovery_detected,
      option_count_detected: analysis.option_count_detected,
      commitment_attempt_detected: analysis.commitment_attempt_detected
    }
  });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateScenario } from "@/lib/scenario/scenario-randomizer";
import { generateOpeningMessage } from "@/lib/ai/generate-opening-message";
import { generateScenarioSchema } from "@/lib/validation/scenarios";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = generateScenarioSchema.parse(await request.json());
  const generated = await generateScenario({
    userId: user.id,
    mode: body.mode,
    difficultyMode: body.difficulty_mode,
    coachMode: body.coach_mode,
    category: body.category,
    presetId: body.preset_id
  });

  const session = await prisma.scenarioSession.create({
    data: {
      userId: user.id,
      organizationId: user.organizationId,
      teamId: user.teamId,
      mode: body.mode,
      difficultyMode: body.difficulty_mode,
      coachMode: body.coach_mode,
      scenarioTitle: generated.scenario_title,
      visibleProblem: generated.visible_problem,
      hiddenProblem: generated.hidden_problem,
      homeownerPersonality: generated.homeowner_personality,
      hiddenMotivation: generated.hidden_motivation,
      objectionStyle: generated.objection_style,
      urgencyLevel: generated.urgency_level,
      homeAgeRange: generated.home_age_range,
      neighborhoodType: generated.neighborhood_type,
      spouseInvolved: generated.spouse_involved,
      priorContractorSeen: generated.prior_contractor_seen,
      expectedBestPath: generated.expected_best_path,
      failureConditions: generated.failure_conditions,
      status: "created"
    }
  });

  const opening = await generateOpeningMessage(generated);

  await prisma.scenarioTurn.create({
    data: {
      scenarioSessionId: session.id,
      turnIndex: 0,
      speaker: "homeowner",
      messageText: opening,
      metadataJson: { type: "opening_message" }
    }
  });

  return NextResponse.json({
    scenario_session_id: session.id,
    scenario_title: generated.scenario_title,
    visible_problem: generated.visible_problem,
    difficulty_mode: body.difficulty_mode,
    coach_mode: body.coach_mode,
    opening_homeowner_message: opening
  });
}

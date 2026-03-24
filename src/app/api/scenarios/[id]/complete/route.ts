import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateScenarioFeedback } from "@/lib/ai/generate-scenario-feedback";
import { scoreScenario } from "@/lib/ai/score-scenario";
import { persistRecentScenarioMemory } from "@/lib/scenario/anti-repetition";
import { refreshUserProgress } from "@/lib/scoring/aggregate-progress";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await prisma.scenarioSession.findFirst({
    where: { id, userId: user.id },
    include: { turns: { orderBy: { turnIndex: "asc" } } }
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = session.turns.map((turn) => turn.messageText);
  const scores = await scoreScenario(messages);
  const overallScore = Math.round(
    (scores.rapport_score +
      scores.discovery_score +
      scores.risk_explanation_score +
      scores.education_score +
      scores.options_score +
      scores.commitment_score) / 6
  );
  const feedback = await generateScenarioFeedback(messages, session.hiddenMotivation);

  await prisma.scenarioSession.update({
    where: { id: session.id },
    data: { status: "completed", completedAt: new Date() }
  });

  await prisma.scenarioScore.upsert({
    where: { scenarioSessionId: session.id },
    update: {
      rapportScore: scores.rapport_score,
      discoveryScore: scores.discovery_score,
      riskExplanationScore: scores.risk_explanation_score,
      educationScore: scores.education_score,
      optionsScore: scores.options_score,
      commitmentScore: scores.commitment_score,
      overallScore
    },
    create: {
      scenarioSessionId: session.id,
      rapportScore: scores.rapport_score,
      discoveryScore: scores.discovery_score,
      riskExplanationScore: scores.risk_explanation_score,
      educationScore: scores.education_score,
      optionsScore: scores.options_score,
      commitmentScore: scores.commitment_score,
      overallScore
    }
  });

  await prisma.scenarioFeedback.upsert({
    where: { scenarioSessionId: session.id },
    update: {
      missedQuestions: feedback.missed_questions,
      missedMotivations: feedback.missed_motivations,
      strongMoments: feedback.strong_moments,
      phrasingImprovements: feedback.phrasing_improvements,
      nextAttemptStrategy: feedback.next_attempt_strategy
    },
    create: {
      scenarioSessionId: session.id,
      missedQuestions: feedback.missed_questions,
      missedMotivations: feedback.missed_motivations,
      strongMoments: feedback.strong_moments,
      phrasingImprovements: feedback.phrasing_improvements,
      nextAttemptStrategy: feedback.next_attempt_strategy
    }
  });

  await persistRecentScenarioMemory({
    userId: user.id,
    scenarioSessionId: session.id,
    visibleProblem: session.visibleProblem,
    homeownerPersonality: session.homeownerPersonality,
    hiddenMotivation: session.hiddenMotivation
  });

  await refreshUserProgress(user.id);

  return NextResponse.json({
    scores: {
      rapport_score: scores.rapport_score,
      discovery_score: scores.discovery_score,
      risk_explanation_score: scores.risk_explanation_score,
      education_score: scores.education_score,
      options_score: scores.options_score,
      commitment_score: scores.commitment_score,
      overall_score: overallScore
    },
    feedback
  });
}

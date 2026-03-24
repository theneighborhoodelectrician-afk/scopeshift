import { notFound } from "next/navigation";
import type { ChatMessage } from "@/components/scenario/chat-window";
import { ScenarioHeader } from "@/components/scenario/scenario-header";
import { ScenarioSessionClient } from "@/components/scenario/scenario-session-client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatMode(value: string) {
  return value.replaceAll("_", " ");
}

function isChatSpeaker(speaker: string): speaker is ChatMessage["speaker"] {
  return speaker === "homeowner" || speaker === "technician" || speaker === "coach";
}

function getCoachHint(coachMode: string, status: string) {
  if (coachMode === "off") {
    return null;
  }

  if (status === "completed") {
    return "Session complete. Review the feedback panel next for discovery gaps and stronger phrasing options.";
  }

  return coachMode === "full"
    ? "Build trust first, then ask why they called today, how long the issue has been happening, and who else will help decide."
    : "Ask what prompted the call today and whether any future renovation plans might change the solution.";
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  if (user == null) {
    notFound();
  }

  const { id } = await params;
  const session = await prisma.scenarioSession.findFirst({
    where: { id, userId: user.id },
    include: {
      turns: { orderBy: { turnIndex: "asc" } },
      score: true,
      feedback: true
    }
  });

  if (session == null) {
    notFound();
  }

  if (session.status === "created") {
    await prisma.scenarioSession.update({
      where: { id: session.id },
      data: {
        status: "active",
        startedAt: session.startedAt ?? new Date()
      }
    });
  }

  const messages = session.turns.reduce<ChatMessage[]>((collection, turn) => {
    if (isChatSpeaker(turn.speaker) === false) {
      return collection;
    }

    collection.push({
      id: turn.id,
      speaker: turn.speaker,
      text: turn.messageText
    });

    return collection;
  }, []);

  const subtitle = `${formatMode(session.difficultyMode)} · coach ${session.coachMode} · ${session.visibleProblem}`;
  const initialResults = session.score && session.feedback
    ? {
        scores: {
          rapport_score: session.score.rapportScore,
          discovery_score: session.score.discoveryScore,
          risk_explanation_score: session.score.riskExplanationScore,
          education_score: session.score.educationScore,
          options_score: session.score.optionsScore,
          commitment_score: session.score.commitmentScore,
          overall_score: session.score.overallScore
        },
        feedback: {
          missed_questions: Array.isArray(session.feedback.missedQuestions) ? (session.feedback.missedQuestions as string[]) : [],
          missed_motivations: Array.isArray(session.feedback.missedMotivations) ? (session.feedback.missedMotivations as string[]) : [],
          strong_moments: Array.isArray(session.feedback.strongMoments) ? (session.feedback.strongMoments as string[]) : [],
          phrasing_improvements: Array.isArray(session.feedback.phrasingImprovements) ? (session.feedback.phrasingImprovements as string[]) : [],
          next_attempt_strategy: session.feedback.nextAttemptStrategy
        }
      }
    : null;

  return (
    <main className="space-y-6">
      <ScenarioHeader title={session.scenarioTitle} subtitle={subtitle} />
      <ScenarioSessionClient
        initialCoachHint={getCoachHint(session.coachMode, session.status)}
        initialMessages={messages}
        initialResults={initialResults}
        initiallyCompleted={session.status === "completed"}
        sessionId={session.id}
      />
    </main>
  );
}

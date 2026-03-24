import { prisma } from "@/lib/db";

function decimal(value: number) {
  return value.toFixed(2);
}

type ScoreKey =
  | "rapportScore"
  | "discoveryScore"
  | "riskExplanationScore"
  | "educationScore"
  | "optionsScore"
  | "commitmentScore"
  | "overallScore";

export async function refreshUserProgress(userId: string) {
  const scores = await prisma.scenarioScore.findMany({
    where: { scenarioSession: { userId, status: "completed" } },
    include: { scenarioSession: true },
    orderBy: { createdAt: "desc" }
  });

  const totalSessions = await prisma.scenarioSession.count({ where: { userId } });
  const completedSessions = scores.length;

  const average = (key: ScoreKey) => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, score) => sum + score[key], 0);
    return total / scores.length;
  };

  const lastSessionAt = scores[0]?.scenarioSession.completedAt ?? null;

  await prisma.userProgress.upsert({
    where: { userId },
    update: {
      totalSessions,
      completedSessions,
      avgRapportScore: decimal(average("rapportScore")),
      avgDiscoveryScore: decimal(average("discoveryScore")),
      avgRiskExplanationScore: decimal(average("riskExplanationScore")),
      avgEducationScore: decimal(average("educationScore")),
      avgOptionsScore: decimal(average("optionsScore")),
      avgCommitmentScore: decimal(average("commitmentScore")),
      avgOverallScore: decimal(average("overallScore")),
      currentStreak: completedSessions,
      longestStreak: completedSessions,
      lastSessionAt
    },
    create: {
      userId,
      totalSessions,
      completedSessions,
      avgRapportScore: decimal(average("rapportScore")),
      avgDiscoveryScore: decimal(average("discoveryScore")),
      avgRiskExplanationScore: decimal(average("riskExplanationScore")),
      avgEducationScore: decimal(average("educationScore")),
      avgOptionsScore: decimal(average("optionsScore")),
      avgCommitmentScore: decimal(average("commitmentScore")),
      avgOverallScore: decimal(average("overallScore")),
      currentStreak: completedSessions,
      longestStreak: completedSessions,
      lastSessionAt
    }
  });
}

import { prisma } from "@/lib/db";

export async function getRecentScenarioMemory(userId: string) {
  return prisma.recentScenarioMemory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5
  });
}

export async function persistRecentScenarioMemory(input: {
  userId: string;
  scenarioSessionId: string;
  visibleProblem: string;
  homeownerPersonality: string;
  hiddenMotivation: string;
}) {
  await prisma.recentScenarioMemory.create({
    data: input
  });

  const recent = await prisma.recentScenarioMemory.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" }
  });

  const stale = recent.slice(5);
  if (stale.length > 0) {
    await prisma.recentScenarioMemory.deleteMany({
      where: { id: { in: stale.map((item) => item.id) } }
    });
  }
}

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'manager', 'technician', 'admin');

-- CreateEnum
CREATE TYPE "ScenarioMode" AS ENUM ('random', 'targeted');

-- CreateEnum
CREATE TYPE "DifficultyMode" AS ENUM ('guided_mode', 'field_mode', 'ride_along_mode');

-- CreateEnum
CREATE TYPE "CoachMode" AS ENUM ('off', 'light', 'full');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('created', 'active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "SpeakerType" AS ENUM ('homeowner', 'technician', 'coach', 'system');

-- CreateEnum
CREATE TYPE "ScenarioCategory" AS ENUM ('outlet_issue', 'surge_protection', 'panel_upgrade', 'generator_backup', 'ev_charger', 'fixture_install', 'breaker_issue', 'partial_power', 'gfci_issue', 'remodel_prep');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "teamId" UUID,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'technician',
    "passwordHash" TEXT,
    "authProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "teamId" UUID,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioTemplate" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ScenarioCategory" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "teamId" UUID,
    "scenarioTemplateId" UUID,
    "mode" "ScenarioMode" NOT NULL,
    "difficultyMode" "DifficultyMode" NOT NULL,
    "coachMode" "CoachMode" NOT NULL,
    "scenarioTitle" TEXT NOT NULL,
    "visibleProblem" TEXT NOT NULL,
    "hiddenProblem" TEXT NOT NULL,
    "homeownerPersonality" TEXT NOT NULL,
    "hiddenMotivation" TEXT NOT NULL,
    "objectionStyle" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "homeAgeRange" TEXT,
    "neighborhoodType" TEXT,
    "spouseInvolved" BOOLEAN NOT NULL DEFAULT false,
    "priorContractorSeen" BOOLEAN NOT NULL DEFAULT false,
    "expectedBestPath" JSONB,
    "failureConditions" JSONB,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'created',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioTurn" (
    "id" UUID NOT NULL,
    "scenarioSessionId" UUID NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "speaker" "SpeakerType" NOT NULL,
    "messageText" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioScore" (
    "id" UUID NOT NULL,
    "scenarioSessionId" UUID NOT NULL,
    "rapportScore" INTEGER NOT NULL,
    "discoveryScore" INTEGER NOT NULL,
    "riskExplanationScore" INTEGER NOT NULL,
    "educationScore" INTEGER NOT NULL,
    "optionsScore" INTEGER NOT NULL,
    "commitmentScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioFeedback" (
    "id" UUID NOT NULL,
    "scenarioSessionId" UUID NOT NULL,
    "missedQuestions" JSONB NOT NULL,
    "missedMotivations" JSONB NOT NULL,
    "strongMoments" JSONB NOT NULL,
    "phrasingImprovements" JSONB NOT NULL,
    "nextAttemptStrategy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "avgRapportScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgDiscoveryScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgRiskExplanationScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgEducationScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgOptionsScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgCommitmentScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgOverallScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticePreset" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "createdByUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "difficultyMode" "DifficultyMode" NOT NULL,
    "coachMode" "CoachMode" NOT NULL,
    "enabledVisibleProblems" JSONB NOT NULL,
    "enabledHiddenProblems" JSONB NOT NULL,
    "enabledPersonalities" JSONB NOT NULL,
    "enabledMotivations" JSONB NOT NULL,
    "enabledObjectionStyles" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentScenarioMemory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scenarioSessionId" UUID NOT NULL,
    "visibleProblem" TEXT NOT NULL,
    "homeownerPersonality" TEXT NOT NULL,
    "hiddenMotivation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentScenarioMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "teamId" UUID,
    "weekStartDate" DATE NOT NULL,
    "averageScore" DECIMAL(5,2) NOT NULL,
    "sessionsCompleted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_teamId_idx" ON "Membership"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioTemplate_slug_key" ON "ScenarioTemplate"("slug");

-- CreateIndex
CREATE INDEX "ScenarioSession_userId_idx" ON "ScenarioSession"("userId");

-- CreateIndex
CREATE INDEX "ScenarioSession_organizationId_idx" ON "ScenarioSession"("organizationId");

-- CreateIndex
CREATE INDEX "ScenarioSession_teamId_idx" ON "ScenarioSession"("teamId");

-- CreateIndex
CREATE INDEX "ScenarioSession_scenarioTemplateId_idx" ON "ScenarioSession"("scenarioTemplateId");

-- CreateIndex
CREATE INDEX "ScenarioSession_completedAt_idx" ON "ScenarioSession"("completedAt");

-- CreateIndex
CREATE INDEX "ScenarioTurn_scenarioSessionId_idx" ON "ScenarioTurn"("scenarioSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioTurn_scenarioSessionId_turnIndex_key" ON "ScenarioTurn"("scenarioSessionId", "turnIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioScore_scenarioSessionId_key" ON "ScenarioScore"("scenarioSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioFeedback_scenarioSessionId_key" ON "ScenarioFeedback"("scenarioSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "PracticePreset_organizationId_idx" ON "PracticePreset"("organizationId");

-- CreateIndex
CREATE INDEX "PracticePreset_createdByUserId_idx" ON "PracticePreset"("createdByUserId");

-- CreateIndex
CREATE INDEX "RecentScenarioMemory_userId_idx" ON "RecentScenarioMemory"("userId");

-- CreateIndex
CREATE INDEX "RecentScenarioMemory_scenarioSessionId_idx" ON "RecentScenarioMemory"("scenarioSessionId");

-- CreateIndex
CREATE INDEX "RecentScenarioMemory_createdAt_idx" ON "RecentScenarioMemory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_userId_idx" ON "LeaderboardEntry"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_teamId_idx" ON "LeaderboardEntry"("teamId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_weekStartDate_idx" ON "LeaderboardEntry"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_weekStartDate_key" ON "LeaderboardEntry"("userId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSession" ADD CONSTRAINT "ScenarioSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSession" ADD CONSTRAINT "ScenarioSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSession" ADD CONSTRAINT "ScenarioSession_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSession" ADD CONSTRAINT "ScenarioSession_scenarioTemplateId_fkey" FOREIGN KEY ("scenarioTemplateId") REFERENCES "ScenarioTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioTurn" ADD CONSTRAINT "ScenarioTurn_scenarioSessionId_fkey" FOREIGN KEY ("scenarioSessionId") REFERENCES "ScenarioSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioScore" ADD CONSTRAINT "ScenarioScore_scenarioSessionId_fkey" FOREIGN KEY ("scenarioSessionId") REFERENCES "ScenarioSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioFeedback" ADD CONSTRAINT "ScenarioFeedback_scenarioSessionId_fkey" FOREIGN KEY ("scenarioSessionId") REFERENCES "ScenarioSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePreset" ADD CONSTRAINT "PracticePreset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePreset" ADD CONSTRAINT "PracticePreset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentScenarioMemory" ADD CONSTRAINT "RecentScenarioMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentScenarioMemory" ADD CONSTRAINT "RecentScenarioMemory_scenarioSessionId_fkey" FOREIGN KEY ("scenarioSessionId") REFERENCES "ScenarioSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

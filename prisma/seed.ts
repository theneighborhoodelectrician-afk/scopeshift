import bcrypt from "bcryptjs";
import { PrismaClient, ScenarioCategory } from "@prisma/client";

const prisma = new PrismaClient();

const orgName = process.env.SEED_ORG_NAME ?? "Local Demo Company";
const orgSlug = process.env.SEED_ORG_SLUG ?? "local";
const teamName = process.env.SEED_TEAM_NAME ?? "Field Team A";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@scopeshift.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "scopeshift";

const templates = [
  {
    name: "Just Fix Outlet",
    slug: "just_fix_outlet",
    category: ScenarioCategory.outlet_issue,
    description: "Basic outlet issue that should expand into a broader safety and reliability conversation."
  },
  {
    name: "Surge Protection Resistance",
    slug: "surge_protection_resistance",
    category: ScenarioCategory.surge_protection,
    description: "Customer resists preventive upgrades until risks are explained clearly."
  },
  {
    name: "Panel Upgrade Hesitation",
    slug: "panel_upgrade_hesitation",
    category: ScenarioCategory.panel_upgrade,
    description: "A capacity and safety conversation with hesitation around scope and price."
  },
  {
    name: "Fixture Install Urgency",
    slug: "fixture_install_urgency",
    category: ScenarioCategory.fixture_install,
    description: "Simple install request with timeline pressure and a hidden electrical issue."
  },
  {
    name: "Generator Backup Confusion",
    slug: "generator_backup_confusion",
    category: ScenarioCategory.generator_backup,
    description: "Homeowner is unsure what backup power actually solves for the home."
  },
  {
    name: "EV Charger Hesitation",
    slug: "ev_charger_hesitation",
    category: ScenarioCategory.ev_charger,
    description: "Capacity and future-planning conversation around EV charging installation."
  },
  {
    name: "Breaker Tripping Scope Expand",
    slug: "breaker_tripping_scope_expand",
    category: ScenarioCategory.breaker_issue,
    description: "Technician needs to widen the conversation beyond simply replacing a breaker."
  },
  {
    name: "Partial Power Hidden Panel Issue",
    slug: "partial_power_hidden_panel_issue",
    category: ScenarioCategory.partial_power,
    description: "Partial power loss points to a deeper panel or wiring concern."
  },
  {
    name: "GFCI Issue Broader Safety Conversation",
    slug: "gfci_issue_broader_safety_conversation",
    category: ScenarioCategory.gfci_issue,
    description: "A bathroom GFCI call should develop into a larger safety conversation."
  },
  {
    name: "Remodel Prep Capacity Conversation",
    slug: "remodel_prep_capacity_conversation",
    category: ScenarioCategory.remodel_prep,
    description: "Kitchen remodel prep uncovers load, planning, and future capacity needs."
  }
];

async function seedDemoOrg() {
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    create: { name: orgName, slug: orgSlug },
    update: { name: orgName }
  });

  let team = await prisma.team.findFirst({
    where: { organizationId: org.id, name: teamName }
  });
  if (!team) {
    team = await prisma.team.create({
      data: { organizationId: org.id, name: teamName }
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      firstName: "Admin",
      lastName: "User",
      role: "owner",
      passwordHash,
      organizationId: org.id,
      teamId: team.id
    },
    update: {
      organizationId: org.id,
      teamId: team.id,
      role: "owner",
      passwordHash
    }
  });

  await prisma.userProgress.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {}
  });

  return { org, team, user };
}

async function main() {
  for (const template of templates) {
    await prisma.scenarioTemplate.upsert({
      where: { slug: template.slug },
      update: template,
      create: template
    });
  }

  const { org, user } = await seedDemoOrg();
  console.log(
    `Seeded org "${org.name}" (${org.slug}) and admin ${user.email}. ` +
      `Set SEED_* env vars in .env to change (see .env.example).`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 3 });
  console.log(JSON.stringify({
    users: users.map((user) => ({ id: user.id, email: user.email })),
    generated_at: new Date().toISOString()
  }, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

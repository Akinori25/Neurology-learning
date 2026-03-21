import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Usage: npx tsx src/scripts/create-user.ts <loginId> <name> <password> [role]");
    console.log("Roles: ADMIN | EDITOR | LEARNER (default)");
    process.exit(1);
  }

  const [loginId, name, password, roleArg] = args;
  const role = roleArg ? roleArg.toUpperCase() : "LEARNER";

  if (!["ADMIN", "EDITOR", "LEARNER"].includes(role)) {
    console.error("Error: Invalid role. Must be one of ADMIN, EDITOR, LEARNER.");
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { loginId },
    });

    if (existingUser) {
      console.error(`Error: User with loginId '${loginId}' already exists.`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        loginId,
        name,
        passwordHash,
        role: role as any,
      },
    });

    console.log(`created: ${loginId} / ${password}`);
  } catch (error) {
    console.error("Prisma error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

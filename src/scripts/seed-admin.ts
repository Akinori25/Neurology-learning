import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  const adminId = "admin";
  const password = "admin";
  const hashedPassword = await hashPassword(password);

  console.log("Upserting admin user...");

  await prisma.user.upsert({
    where: { loginId: adminId },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
    create: {
      name: "Admin User",
      loginId: adminId,
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Successfully seeded admin user: loginId=admin, password=admin");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

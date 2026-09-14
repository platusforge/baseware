import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Change-me-123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: { email: "admin@example.com", name: "Admin", passwordHash, type: "admin", emailVerifiedAt: new Date(), mustChangePassword: true },
    update: { mustChangePassword: true },
  });

  await prisma.role.upsert({
    where: { name: "admin" },
    create: { name: "admin", allowedPages: ["dashboard", "members", "billing", "api-keys", "audit", "admin"] },
    update: {},
  });
  await prisma.role.upsert({
    where: { name: "member" },
    create: { name: "member", allowedPages: ["dashboard", "billing"] },
    update: {},
  });

  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    create: { name: "Demo Inc", slug: "demo", plan: "pro" },
    update: {},
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
    create: { userId: admin.id, organizationId: org.id, role: "owner" },
    update: {},
  });

  await prisma.userPermission.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, allowedPages: ["dashboard", "members", "billing", "api-keys", "audit", "admin"], configured: true },
    update: {},
  });

  console.log("Seed complete: admin@example.com / Change-me-123!");
}

main().finally(() => prisma.$disconnect());

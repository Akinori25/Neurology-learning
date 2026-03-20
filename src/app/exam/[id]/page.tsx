import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ExamRunnerClient from "./ExamRunnerClient";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export default async function ExamRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          draft: {
            include: {
              learningPoint: { include: { references: true } },
              imageAsset: true,
            },
          },
        },
      },
    },
  });

  if (!exam || !exam.isPublished || exam.items.length === 0) {
    notFound();
  }

  return <ExamRunnerClient exam={exam} items={exam.items} />;
}

"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export async function submitExamAttempt(data: {
  examId: string;
  score: number;
  totalQuestions: number;
  deviation: number | null;
  passed: boolean | null;
}) {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    throw new Error("ログインが必要です");
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      examId: data.examId,
      userId: session.userId,
      score: data.score,
      totalQuestions: data.totalQuestions,
      deviation: data.deviation,
      passed: data.passed,
    },
  });

  return attempt.id;
}

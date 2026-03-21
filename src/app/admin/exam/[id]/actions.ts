"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePublishExam(examId: string, isPublished: boolean) {
  await prisma.exam.update({
    where: { id: examId },
    data: { isPublished, publishedAt: isPublished ? new Date() : null },
  });
  revalidatePath(`/admin/exam/${examId}`);
  revalidatePath("/admin/exam");
  revalidatePath("/exam");
}

export async function addManyDraftsToExam(examId: string, draftIds: string[]) {
  await prisma.$transaction(async (tx) => {
    const maxItem = await tx.examItem.findFirst({
      where: { examId },
      orderBy: { orderIndex: "desc" },
    });
    let nextIndex = maxItem ? maxItem.orderIndex + 1 : 0;
    
    const existing = await tx.examItem.findMany({
      where: { examId, questionDraftId: { in: draftIds } },
      select: { questionDraftId: true }
    });
    const existingIds = new Set(existing.map(e => e.questionDraftId));
    
    const newDraftIds = draftIds.filter(id => !existingIds.has(id));
    if (newDraftIds.length === 0) return;

    for (const draftId of newDraftIds) {
      await tx.examItem.create({
        data: { examId, questionDraftId: draftId, orderIndex: nextIndex++ },
      });
    }

    await tx.questionDraft.updateMany({
      where: { id: { in: newDraftIds } },
      data: { isAvailableInQuiz: false },
    });
  });

  revalidatePath(`/admin/exam/${examId}`);
}

export async function removeDraftFromExam(examId: string, draftId: string) {
  await prisma.examItem.delete({
    where: { examId_questionDraftId: { examId, questionDraftId: draftId } },
  });
  revalidatePath(`/admin/exam/${examId}`);
}

export async function calculateExamStats(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      items: {
        include: {
          draft: { include: { learningPoint: true } },
        },
      },
    },
  });

  if (!exam || exam.items.length === 0) return;

  let sumP = 0;
  let sumP1MinusP = 0;

  for (const item of exam.items) {
    const meta = item.draft.generationMeta as Record<string, any> | null;
    let baseP = 0.5;

    if (meta && typeof meta.difficultyScore === "number") {
      const d = meta.difficultyScore;
      if (d <= 1) baseP = 0.90;
      else if (d <= 2) baseP = 0.75;
      else if (d <= 3) baseP = 0.60;
      else if (d <= 4) baseP = 0.45;
      else baseP = 0.30;
    } else {
      const diff = item.draft.learningPoint.difficulty;
      if (diff === "CORE") baseP = 0.85;
      else if (diff === "STANDARD") baseP = 0.70;
      else if (diff === "HARD") baseP = 0.50;
      else if (diff === "INSANE") baseP = 0.30;
    }

    let bonus = 0;
    if (meta && typeof meta.discriminationScore === "number") {
      bonus = (meta.discriminationScore - 3) * 0.05;
    }

    let p = baseP + bonus;
    if (p < 0.10) p = 0.10;
    if (p > 0.95) p = 0.95;

    sumP += p;
    sumP1MinusP += p * (1 - p);
  }

  const mean = Math.round(sumP * 100) / 100;
  const stdDev = Math.round(Math.sqrt(sumP1MinusP) * 100) / 100;

  await prisma.exam.update({
    where: { id: examId },
    data: {
      predictedMeanScore: mean,
      predictedStdDev: stdDev,
      passDeviationThreshold: 50, // default pass threshold
    },
  });

  revalidatePath(`/admin/exam/${examId}`);
  return { mean, stdDev };
}

export async function updateExamMetadata(examId: string, formData: FormData) {
  const mean = parseFloat(formData.get("predictedMeanScore") as string);
  const stdDev = parseFloat(formData.get("predictedStdDev") as string);
  const passThreshold = parseFloat(formData.get("passDeviationThreshold") as string);
  const seconds = parseInt(formData.get("secondsPerQuestion") as string, 10);

  await prisma.exam.update({
    where: { id: examId },
    data: {
      predictedMeanScore: isNaN(mean) ? null : mean,
      predictedStdDev: isNaN(stdDev) ? null : stdDev,
      passDeviationThreshold: isNaN(passThreshold) ? null : passThreshold,
      secondsPerQuestion: isNaN(seconds) ? null : seconds,
    },
  });
  revalidatePath(`/admin/exam/${examId}`);
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePublishSet(setId: string, isPublished: boolean) {
  await prisma.questionSet.update({
    where: { id: setId },
    data: { isPublished, publishedAt: isPublished ? new Date() : null },
  });
  revalidatePath(`/admin/question-sets/${setId}`);
  revalidatePath("/admin/question-sets");
  revalidatePath("/question-sets");
}

export async function searchPublishedDrafts(
  topicFilter: string = "", 
  subtopicFilter: string = "", 
  difficultyFilter: any = "", 
  query: string = ""
) {
  return prisma.questionDraft.findMany({
    where: {
      isPublished: true,
      stem: { contains: query, mode: "insensitive" },
      learningPoint: {
        ...(topicFilter ? { topic: { contains: topicFilter, mode: "insensitive" } } : {}),
        ...(subtopicFilter ? { subtopic: { contains: subtopicFilter, mode: "insensitive" } } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      },
    },
    take: 30,
    include: { learningPoint: { select: { topic: true, subtopic: true, difficulty: true } } },
  });
}

export async function addManyDraftsToSet(setId: string, draftIds: string[]) {
  await prisma.$transaction(async (tx) => {
    const maxItem = await tx.questionSetItem.findFirst({
      where: { questionSetId: setId },
      orderBy: { orderIndex: "desc" },
    });
    
    let nextIndex = maxItem ? maxItem.orderIndex + 1 : 0;
    
    const existing = await tx.questionSetItem.findMany({
      where: { questionSetId: setId, questionDraftId: { in: draftIds } },
      select: { questionDraftId: true }
    });
    const existingIds = new Set(existing.map(e => e.questionDraftId));
    
    const newDraftIds = draftIds.filter(id => !existingIds.has(id));
    if (newDraftIds.length === 0) return;

    for (const draftId of newDraftIds) {
      await tx.questionSetItem.create({
        data: {
          questionSetId: setId,
          questionDraftId: draftId,
          orderIndex: nextIndex++,
        },
      });
    }

    await tx.questionDraft.updateMany({
      where: { id: { in: newDraftIds } },
      data: { isAvailableInQuiz: false },
    });
  });

  revalidatePath(`/admin/question-sets/${setId}`);
}

export async function removeDraftFromSet(setId: string, draftId: string) {
  await prisma.questionSetItem.delete({
    where: {
      questionSetId_questionDraftId: {
        questionSetId: setId,
        questionDraftId: draftId,
      },
    },
  });
  revalidatePath(`/admin/question-sets/${setId}`);
}

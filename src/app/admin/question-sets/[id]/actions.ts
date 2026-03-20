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

export async function searchPublishedDrafts(topicFilter: string, query: string = "") {
  return prisma.questionDraft.findMany({
    where: {
      isPublished: true,
      learningPoint: {
        topic: { contains: topicFilter, mode: "insensitive" },
      },
      stem: { contains: query, mode: "insensitive" },
    },
    take: 30,
    include: { learningPoint: { select: { topic: true, subtopic: true } } },
  });
}

export async function addDraftToSet(setId: string, draftId: string) {
  const maxItem = await prisma.questionSetItem.findFirst({
    where: { questionSetId: setId },
    orderBy: { orderIndex: "desc" },
  });
  const nextIndex = maxItem ? maxItem.orderIndex + 1 : 0;
  
  await prisma.questionSetItem.create({
    data: {
      questionSetId: setId,
      questionDraftId: draftId,
      orderIndex: nextIndex,
    },
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

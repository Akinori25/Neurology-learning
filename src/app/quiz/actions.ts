"use server";

import { prisma } from "@/lib/prisma";

type QuestionOnlyInput = {
  questionDraftId: string;
};

type SaveRaiseHandInput = {
  questionDraftId: string;
  comment: string;
};

async function getOrCreateGuestUser() {
  const guestEmail = "guest@example.com";

  const existing = await prisma.user.findUnique({
    where: { email: guestEmail },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      name: "Guest User",
      email: guestEmail,
      role: "LEARNER",
    },
  });
}

export async function toggleDraftGood({ questionDraftId }: QuestionOnlyInput) {
  const learner = await getOrCreateGuestUser();

  const draft = await prisma.questionDraft.findUnique({
    where: { id: questionDraftId },
    select: { id: true, isPublished: true },
  });

  if (!draft || !draft.isPublished) {
    throw new Error("問題が見つかりません。");
  }

  const existing = await prisma.draftGood.findUnique({
    where: {
      questionDraftId_userId: {
        questionDraftId,
        userId: learner.id,
      },
    },
  });

  if (existing) {
    await prisma.draftGood.delete({
      where: {
        questionDraftId_userId: {
          questionDraftId,
          userId: learner.id,
        },
      },
    });

    return { isGood: false };
  }

  await prisma.draftGood.create({
    data: {
      questionDraftId,
      userId: learner.id,
    },
  });

  return { isGood: true };
}

export async function saveRaiseHand({
  questionDraftId,
  comment,
}: SaveRaiseHandInput) {
  const learner = await getOrCreateGuestUser();

  const draft = await prisma.questionDraft.findUnique({
    where: { id: questionDraftId },
    select: { id: true, isPublished: true },
  });

  if (!draft || !draft.isPublished) {
    throw new Error("問題が見つかりません。");
  }

  const trimmed = comment.trim();
  if (!trimmed) {
    throw new Error("コメントが空です。");
  }

  const created = await prisma.draftRaiseHand.create({
    data: {
      questionDraftId,
      userId: learner.id,
      comment: trimmed,
    },
  });

  return {
    id: created.id,
    comment: created.comment,
    createdAt: created.createdAt.toISOString(),
  };
}
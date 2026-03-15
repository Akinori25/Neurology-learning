"use server";

import { prisma } from "@/lib/prisma";

type SubmitAnswerInput = {
  questionDraftId: string;
  selectedAnswer: string;
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
      role: "learner",
    },
  });
}

export async function submitAnswer({
  questionDraftId,
  selectedAnswer,
}: SubmitAnswerInput) {
  const draft = await prisma.questionDraft.findUnique({
    where: { id: questionDraftId },
  });

  if (!draft || !draft.isPublished) {
    throw new Error("問題が見つかりません。");
  }

  const allowed = ["A", "B", "C", "D"];
  if (!allowed.includes(selectedAnswer)) {
    throw new Error("回答が不正です。");
  }

  const isCorrect = draft.correctAnswer === selectedAnswer;
  const learner = await getOrCreateGuestUser();

  await prisma.userAttempt.create({
    data: {
      userId: learner.id,
      questionDraftId,
      selectedAnswer,
      isCorrect,
    },
  });

  return {
    isCorrect,
    correctAnswer: draft.correctAnswer,
    explanation: draft.explanation,
  };
}
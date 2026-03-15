"use server";

import { prisma } from "@/lib/prisma";

type SubmitAnswerInput = {
  examQuestionId: string;
  selectedAnswer: string;
};

export async function submitAnswer({
  examQuestionId,
  selectedAnswer,
}: SubmitAnswerInput) {
  const examQuestion = await prisma.examQuestion.findUnique({
    where: { id: examQuestionId },
    include: {
      draft: true,
    },
  });

  if (!examQuestion) {
    throw new Error("問題が見つかりません。");
  }

  const isCorrect = examQuestion.draft.correctAnswer === selectedAnswer;

  // まずは seed の learner@example.com を固定ユーザーとして使う
  const learner = await prisma.user.findUnique({
    where: { email: "learner@example.com" },
  });

  if (!learner) {
    throw new Error("テストユーザーが見つかりません。seed を確認してください。");
  }

  await prisma.userAttempt.create({
    data: {
      userId: learner.id,
      examQuestionId,
      selectedAnswer,
      isCorrect,
    },
  });

  return {
    isCorrect,
    correctAnswer: examQuestion.draft.correctAnswer,
    explanation: examQuestion.draft.explanation,
  };
}
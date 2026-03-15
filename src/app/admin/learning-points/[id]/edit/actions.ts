"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Difficulty, QuestionStyle } from "@prisma/client";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isDifficulty(value: string | null | undefined): value is Difficulty {
  return (
    value === "CORE" ||
    value === "STANDARD" ||
    value === "HARD" ||
    value === "INSANE"
  );
}

function isQuestionStyle(
  value: string | null | undefined
): value is QuestionStyle {
  return (
    value === "FACT" ||
    value === "CASE" ||
    value === "DIFFERENTIAL" ||
    value === "TREATMENT" ||
    value === "IMAGE"
  );
}

export async function updateLearningPoint(formData: FormData) {
  const id = getTrimmedString(formData, "id");

  if (!id) {
    throw new Error("論点IDがありません。");
  }

  const topic = getTrimmedString(formData, "topic");
  const subtopic = getTrimmedString(formData, "subtopic") || null;
  const title = getTrimmedString(formData, "title");
  const learningPoint = getTrimmedString(formData, "learningPoint");
  const rationale = getTrimmedString(formData, "rationale") || null;
  const difficultyRaw = getTrimmedString(formData, "difficulty");
  const questionStyleRaw = getTrimmedString(formData, "questionStyle");
  const tagsRaw = getTrimmedString(formData, "tags");
  const sourceId = getTrimmedString(formData, "sourceId") || null;
  const imageAssetId = getTrimmedString(formData, "imageAssetId") || null;

  if (!topic || !title || !learningPoint) {
    throw new Error("必須項目が不足しています。");
  }

  if (!isDifficulty(difficultyRaw)) {
    throw new Error("難易度が不正です。");
  }

  if (!isQuestionStyle(questionStyleRaw)) {
    throw new Error("問題形式が不正です。");
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const existing = await prisma.learningPoint.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("論点が見つかりません。");
  }

  await prisma.learningPoint.update({
    where: { id },
    data: {
      sourceId,
      topic,
      subtopic,
      title,
      learningPoint,
      rationale,
      difficulty: difficultyRaw,
      questionStyle: questionStyleRaw,
      tags,
    },
  });

  await prisma.learningPointImage.deleteMany({
    where: { learningPointId: id },
  });

  if (imageAssetId) {
    await prisma.learningPointImage.create({
      data: {
        learningPointId: id,
        imageAssetId,
      },
    });
  }

  redirect(`/admin/learning-points/${id}`);
}
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Difficulty,
  QuestionStyle,
  LearningPointOrigin,
} from "@prisma/client";

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

export async function createLearningPoint(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const learningPoint = (formData.get("learningPoint") as string)?.trim();
  const rationale = (formData.get("rationale") as string)?.trim() || null;
  const difficultyRaw = (formData.get("difficulty") as string)?.trim();
  const questionStyleRaw = (formData.get("questionStyle") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";
  const sourceId = ((formData.get("sourceId") as string)?.trim() || "") || null;
  const imageAssetId =
    ((formData.get("imageAssetId") as string)?.trim() || "") || null;

  if (!topic || !title || !learningPoint) {
    throw new Error("必須項目が不足しています。");
  }

  if (!isDifficulty(difficultyRaw)) {
    throw new Error("difficulty が不正です。");
  }

  if (!isQuestionStyle(questionStyleRaw)) {
    throw new Error("questionStyle が不正です。");
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const created = await prisma.learningPoint.create({
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
      origin: "MANUAL" satisfies LearningPointOrigin,
    },
  });

  if (imageAssetId) {
    await prisma.learningPointImage.create({
      data: {
        learningPointId: created.id,
        imageAssetId,
      },
    });
  }

  redirect(`/admin/learning-points/${created.id}`);
}
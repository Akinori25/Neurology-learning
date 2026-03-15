"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Difficulty, QuestionStyle } from "@prisma/client";

export async function updateLearningPoint(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("論点IDがありません。");
  }

  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const learningPoint = (formData.get("learningPoint") as string)?.trim();
  const rationale = (formData.get("rationale") as string)?.trim() || null;
  const difficulty = formData.get("difficulty") as Difficulty;
  const questionStyle = formData.get("questionStyle") as QuestionStyle;
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";
  const sourceId = ((formData.get("sourceId") as string)?.trim() || null) || null;
  const imageAssetId =
    ((formData.get("imageAssetId") as string)?.trim() || null) || null;

  if (!topic || !title || !learningPoint) {
    throw new Error("必須項目が不足しています。");
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.learningPoint.update({
    where: { id },
    data: {
      sourceId,
      topic,
      subtopic,
      title,
      learningPoint,
      rationale,
      difficulty,
      questionStyle,
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
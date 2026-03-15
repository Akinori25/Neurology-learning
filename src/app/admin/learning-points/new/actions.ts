"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Difficulty, QuestionStyle, ReviewStatus } from "@prisma/client";

export async function createLearningPoint(formData: FormData) {
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

  const created = await prisma.learningPoint.create({
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
      status: ReviewStatus.DRAFT,
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
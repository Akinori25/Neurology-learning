"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Difficulty } from "@prisma/client";

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
  const tagsRaw = getTrimmedString(formData, "tags");
  const referencesRaw = getTrimmedString(formData, "references");

  if (!topic || !title || !learningPoint) {
    throw new Error("必須項目が不足しています。");
  }

  if (!isDifficulty(difficultyRaw)) {
    throw new Error("難易度が不正です。");
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const referenceUrls = referencesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));

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
      topic,
      subtopic,
      title,
      learningPoint,
      rationale,
      difficulty: difficultyRaw,
      tags,
    },
  });

  // references を入れ替え
  await prisma.learningPointReference.deleteMany({
    where: { learningPointId: id },
  });

  if (referenceUrls.length > 0) {
    await prisma.learningPointReference.createMany({
      data: referenceUrls.map((url, index) => ({
        learningPointId: id,
        url,
        orderIndex: index,
      })),
    });
  }

  redirect(`/admin/learning-points/${id}`);
}
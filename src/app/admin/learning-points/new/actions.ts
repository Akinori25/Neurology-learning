"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Difficulty,
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

export async function createLearningPoint(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const learningPoint = (formData.get("learningPoint") as string)?.trim();
  const rationale = (formData.get("rationale") as string)?.trim() || null;
  const difficultyRaw = (formData.get("difficulty") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";
  const referencesRaw = (formData.get("references") as string)?.trim() || "";

  if (!topic || !title || !learningPoint) {
    throw new Error("必須項目が不足しています。");
  }

  if (!isDifficulty(difficultyRaw)) {
    throw new Error("difficulty が不正です。");
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
    
  const referenceUrls = referencesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));

  const created = await prisma.learningPoint.create({
    data: {
      topic,
      subtopic,
      title,
      learningPoint,
      rationale,
      difficulty: difficultyRaw,
      tags,
      origin: "MANUAL" satisfies LearningPointOrigin,
      references: {
        create: referenceUrls.map((url, index) => ({
          url,
          orderIndex: index,
        })),
      },
    },
  });

  redirect(`/admin/learning-points/${created.id}`);
}
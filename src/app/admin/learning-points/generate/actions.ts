"use server";

import { prisma } from "@/lib/prisma";
import { generateLearningPointCandidates } from "@/lib/learning-point-generator";
import { redirect } from "next/navigation";

export async function generateLearningPointCandidatesAction(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || "";
  const sourceId = ((formData.get("sourceId") as string)?.trim() || "") || null;
  const keywords = (formData.get("keywords") as string)?.trim() || "";
  const countRaw = (formData.get("count") as string)?.trim() || "5";
  const targetDifficulty = (formData.get("targetDifficulty") as string)?.trim() || "";

  if (!topic) {
    throw new Error("topic は必須です。");
  }

  const count = Math.min(Math.max(Number(countRaw) || 5, 1), 10);

  const candidates = await generateLearningPointCandidates({
    topic,
    subtopic,
    sourceId,
    keywords,
    count,
    targetDifficulty: targetDifficulty || undefined,
  });

  return {
    topic,
    subtopic,
    sourceId,
    keywords,
    count,
    targetDifficulty,
    candidates,
  };
}

export async function saveLearningPointCandidate(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const sourceId = ((formData.get("sourceId") as string)?.trim() || "") || null;

  const title = (formData.get("title") as string)?.trim();
  const learningPoint = (formData.get("learningPoint") as string)?.trim();
  const rationale = (formData.get("rationale") as string)?.trim() || null;
  const difficulty = formData.get("difficulty") as
    | "CORE"
    | "STANDARD"
    | "HARD"
    | "INSANE";
  const questionStyle = formData.get("questionStyle") as
    | "FACT"
    | "CASE"
    | "DIFFERENTIAL"
    | "TREATMENT"
    | "IMAGE";
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";

  if (!topic || !title || !learningPoint) {
    throw new Error("保存に必要な項目が不足しています。");
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
      status: "DRAFT",
    },
  });

  redirect(`/admin/learning-points/${created.id}`);
}
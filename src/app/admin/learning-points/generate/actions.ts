"use server";

import { prisma } from "@/lib/prisma";
import { generateLearningPointCandidates } from "@/lib/learning-point-generator";
import { redirect } from "next/navigation";
import { Difficulty, LearningPointOrigin } from "@prisma/client";

function isDifficulty(value: string | null | undefined): value is Difficulty {
  return (
    value === "CORE" ||
    value === "STANDARD" ||
    value === "HARD" ||
    value === "INSANE"
  );
}

export type LearningPointCandidate = {
  title: string;
  learningPoint: string;
  rationale?: string | null;
  difficulty: "CORE" | "STANDARD" | "HARD" | "INSANE";
  tags: string[];
  references: string[];
};

export async function generateLearningPointCandidatesAction(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || "";
  const keywords = (formData.get("keywords") as string)?.trim() || "";
  const countRaw = (formData.get("count") as string)?.trim() || "5";
  const targetDifficultyRaw = (formData.get("targetDifficulty") as string)?.trim();

  if (!topic) {
    throw new Error("topic は必須です。");
  }

  const count = Math.min(Math.max(Number(countRaw) || 5, 1), 10);

  const targetDifficulty = isDifficulty(targetDifficultyRaw)
    ? targetDifficultyRaw
    : undefined;

  const result = await generateLearningPointCandidates({
    topic,
    subtopic,
    keywords,
    count,
    targetDifficulty,
  });

  return {
    topic,
    subtopic,
    keywords,
    count,
    targetDifficulty: targetDifficulty ?? "",
    candidates: result.candidates,
    generatedByModel: result.generatedByModel,
    generationMeta: result.generationMeta,
  };
}

export async function saveLearningPointCandidates(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const candidatesJson = (formData.get("candidatesJson") as string)?.trim();
  const generatedByModel = (formData.get("generatedByModel") as string)?.trim() || null;
  const generationMetaJson = (formData.get("generationMeta") as string)?.trim() || null;

  if (!topic) {
    throw new Error("topic は必須です。");
  }

  if (!candidatesJson) {
    throw new Error("候補データがありません。");
  }

  const selectedIndexes = formData
    .getAll("selectedIndexes")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0);

  if (selectedIndexes.length === 0) {
    throw new Error("保存対象が選択されていません。");
  }

  let parsedCandidates: unknown;
  try {
    parsedCandidates = JSON.parse(candidatesJson);
  } catch {
    throw new Error("候補データの解析に失敗しました。");
  }

  let parsedMeta: unknown = null;
  if (generationMetaJson) {
    try {
      parsedMeta = JSON.parse(generationMetaJson);
    } catch {
      console.warn("generationMeta の解析に失敗しました");
    }
  }

  if (!Array.isArray(parsedCandidates)) {
    throw new Error("候補データの形式が不正です。");
  }

  const candidates = parsedCandidates as LearningPointCandidate[];

  const selectedCandidates = selectedIndexes
    .map((index) => candidates[index])
    .filter((candidate): candidate is LearningPointCandidate => Boolean(candidate));

  if (selectedCandidates.length === 0) {
    throw new Error("有効な候補がありません。");
  }

  for (const candidate of selectedCandidates) {
    if (
      !candidate.title?.trim() ||
      !candidate.learningPoint?.trim() ||
      !isDifficulty(candidate.difficulty) ||
      !Array.isArray(candidate.tags) ||
      !Array.isArray(candidate.references)
    ) {
      throw new Error("候補データに不正な項目があります。");
    }
  }

  await prisma.$transaction(
    selectedCandidates.map((candidate) =>
      prisma.learningPoint.create({
        data: {
          topic,
          subtopic,
          title: candidate.title.trim(),
          learningPoint: candidate.learningPoint.trim(),
          rationale: candidate.rationale?.trim() || null,
          difficulty: candidate.difficulty,
          tags: candidate.tags.map((tag) => tag.trim()).filter(Boolean),
          origin: "PERPLEXITY" satisfies LearningPointOrigin,
          generatedByModel,
          generationMeta: parsedMeta ? (parsedMeta as any) : undefined,
          lastGeneratedAt: new Date(),
          references: {
            create: candidate.references.map((url, index) => ({
              url: url.trim(),
              orderIndex: index,
            })),
          },
        },
      })
    )
  );

  redirect("/admin/learning-points");
}
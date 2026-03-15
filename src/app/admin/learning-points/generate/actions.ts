"use server";

import { prisma } from "@/lib/prisma";
import { generateLearningPointCandidates } from "@/lib/learning-point-generator";
import { redirect } from "next/navigation";
import { Difficulty } from "@prisma/client";

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
): value is "FACT" | "CASE" | "DIFFERENTIAL" | "TREATMENT" | "IMAGE" {
  return (
    value === "FACT" ||
    value === "CASE" ||
    value === "DIFFERENTIAL" ||
    value === "TREATMENT" ||
    value === "IMAGE"
  );
}

export type LearningPointCandidate = {
  title: string;
  learningPoint: string;
  rationale?: string | null;
  difficulty: "CORE" | "STANDARD" | "HARD" | "INSANE";
  questionStyle: "FACT" | "CASE" | "DIFFERENTIAL" | "TREATMENT" | "IMAGE";
  tags: string[];
};

export async function generateLearningPointCandidatesAction(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || "";
  const sourceId = ((formData.get("sourceId") as string)?.trim() || "") || null;
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

  const candidates = await generateLearningPointCandidates({
    topic,
    subtopic,
    sourceId,
    keywords,
    count,
    targetDifficulty,
  });

  return {
    topic,
    subtopic,
    sourceId,
    keywords,
    count,
    targetDifficulty: targetDifficulty ?? "",
    candidates,
  };
}

export async function saveLearningPointCandidates(formData: FormData) {
  const topic = (formData.get("topic") as string)?.trim();
  const subtopic = (formData.get("subtopic") as string)?.trim() || null;
  const sourceId = ((formData.get("sourceId") as string)?.trim() || "") || null;
  const candidatesJson = (formData.get("candidatesJson") as string)?.trim();

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
      !isQuestionStyle(candidate.questionStyle) ||
      !Array.isArray(candidate.tags)
    ) {
      throw new Error("候補データに不正な項目があります。");
    }
  }

  await prisma.$transaction(
    selectedCandidates.map((candidate) =>
      prisma.learningPoint.create({
        data: {
          sourceId,
          topic,
          subtopic,
          title: candidate.title.trim(),
          learningPoint: candidate.learningPoint.trim(),
          rationale: candidate.rationale?.trim() || null,
          difficulty: candidate.difficulty,
          questionStyle: candidate.questionStyle,
          tags: candidate.tags.map((tag) => tag.trim()).filter(Boolean),
          status: "DRAFT",
        },
      })
    )
  );

  redirect("/admin/learning-points");
}
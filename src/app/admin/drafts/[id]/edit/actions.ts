"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateDraft(formData: FormData) {
  const id = getTrimmedString(formData, "id");

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const stem = getTrimmedString(formData, "stem");
  const choiceA = getTrimmedString(formData, "choiceA");
  const choiceB = getTrimmedString(formData, "choiceB");
  const choiceC = getTrimmedString(formData, "choiceC");
  const choiceD = getTrimmedString(formData, "choiceD");
  const correctAnswer = getTrimmedString(formData, "correctAnswer");
  const explanation = getTrimmedString(formData, "explanation");
  const explanationA = getTrimmedString(formData, "explanationA");
  const explanationB = getTrimmedString(formData, "explanationB");
  const explanationC = getTrimmedString(formData, "explanationC");
  const explanationD = getTrimmedString(formData, "explanationD");

  if (!stem) {
    throw new Error("問題文を入力してください。");
  }
  if (!choiceA || !choiceB || !choiceC || !choiceD) {
    throw new Error("選択肢A〜Dをすべて入力してください。");
  }
  if (!explanation) {
    throw new Error("全体解説を入力してください。");
  }

  const allowed = ["A", "B", "C", "D"];
  if (!allowed.includes(correctAnswer)) {
    throw new Error("正答は A / B / C / D のいずれかである必要があります。");
  }

  const existing = await prisma.questionDraft.findUnique({
    where: { id },
    select: { id: true, version: true },
  });

  if (!existing) {
    throw new Error("草案が見つかりません。");
  }

  await prisma.questionDraft.update({
    where: { id },
    data: {
      stem,
      choiceA,
      choiceB,
      choiceC,
      choiceD,
      correctAnswer,
      explanation,
      explanationA: explanationA || null,
      explanationB: explanationB || null,
      explanationC: explanationC || null,
      explanationD: explanationD || null,
      version: existing.version + 1,
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath(`/admin/drafts/${id}/edit`);
  revalidatePath("/quiz");
}
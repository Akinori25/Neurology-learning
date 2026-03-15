"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const stem = formData.get("stem") as string;
  const choiceA = formData.get("choiceA") as string;
  const choiceB = formData.get("choiceB") as string;
  const choiceC = formData.get("choiceC") as string;
  const choiceD = formData.get("choiceD") as string;
  const correctAnswer = formData.get("correctAnswer") as string;
  const explanation = formData.get("explanation") as string;
  const explanationA = formData.get("explanationA") as string;
  const explanationB = formData.get("explanationB") as string;
  const explanationC = formData.get("explanationC") as string;
  const explanationD = formData.get("explanationD") as string;
  const reviewerComment = formData.get("reviewerComment") as string;

  const allowed = ["A", "B", "C", "D"];
  if (!allowed.includes(correctAnswer)) {
    throw new Error("正答は A / B / C / D のいずれかである必要があります。");
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
      reviewerComment: reviewerComment || null,
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath(`/admin/drafts/${id}/edit`);
  revalidatePath("/quiz");
}
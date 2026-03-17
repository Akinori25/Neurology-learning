"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDraftWithLLM } from "@/lib/draft-generator";
import { prisma } from "@/lib/prisma";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function generateDraftFromLearningPoint(formData: FormData) {
  const learningPointId = getTrimmedString(formData, "learningPointId");

  if (!learningPointId) {
    throw new Error("論点IDがありません。");
  }

  const createdDraftId = await generateDraftWithLLM(learningPointId);

  revalidatePath("/admin/learning-points");
  revalidatePath(`/admin/learning-points/${learningPointId}`);
  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${createdDraftId}`);
  revalidatePath("/quiz");

  redirect(`/admin/drafts/${createdDraftId}`);
}

export async function deleteLearningPoint(formData: FormData) {
  const learningPointId = getTrimmedString(formData, "learningPointId");

  if (!learningPointId) {
    throw new Error("論点IDがありません。");
  }

  const learningPoint = await prisma.learningPoint.findUnique({
    where: { id: learningPointId },
    include: {
      drafts: {
        select: { id: true },
      },
    },
  });

  if (!learningPoint) {
    throw new Error("論点が見つかりません。");
  }

  if (learningPoint.drafts.length > 0) {
    throw new Error(
      "草案が紐づいている論点は削除できません。先に草案を整理してください。"
    );
  }

  await prisma.learningPointImage.deleteMany({
    where: { learningPointId },
  });

  await prisma.learningPoint.delete({
    where: { id: learningPointId },
  });

  revalidatePath("/admin/learning-points");
  revalidatePath(`/admin/learning-points/${learningPointId}`);

  redirect("/admin/learning-points");
}
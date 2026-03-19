"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function publishDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const draft = await prisma.questionDraft.findUnique({
    where: { id },
  });

  if (!draft) {
    throw new Error("草案が見つかりません。");
  }

  await prisma.questionDraft.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: draft.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath("/quiz");
}

export async function unpublishDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const draft = await prisma.questionDraft.findUnique({
    where: { id },
  });

  if (!draft) {
    throw new Error("草案が見つかりません。");
  }

  await prisma.questionDraft.update({
    where: { id },
    data: {
      isPublished: false,
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath("/quiz");
}

export async function deleteDraft(formData: FormData) {
  const id = formData.get("id") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/admin/drafts";

  if (!id) {
    throw new Error("草案IDがありません");
  }

  const draft = await prisma.questionDraft.findUnique({
    where: { id },
    include: {
      learningPoint: true,
      setItems: true,
      goods: true,
      raiseHands: true,
      attempts: true,
    },
  });

  if (!draft) {
    throw new Error("草案が見つかりません");
  }

  if (draft.isPublished) {
    throw new Error("公開中の問題は削除できません。先に非公開にしてください。");
  }

  await prisma.questionDraft.delete({
    where: { id },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath(redirectTo);
  revalidatePath("/quiz");

  redirect(redirectTo);
}
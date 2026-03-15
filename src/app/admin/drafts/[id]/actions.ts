"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ReviewStatus, QuestionPublishStatus } from "@prisma/client";
import { redirect } from "next/navigation";

export async function approveDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  await prisma.questionDraft.update({
    where: { id },
    data: {
      status: ReviewStatus.APPROVED,
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath("/quiz");
}

export async function rejectDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  await prisma.questionDraft.update({
    where: { id },
    data: {
      status: ReviewStatus.REJECTED,
    },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
}

export async function publishDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const draft = await prisma.questionDraft.findUnique({
    where: { id },
    include: { published: true },
  });

  if (!draft) {
    throw new Error("草案が見つかりません。");
  }

  if (draft.status !== ReviewStatus.APPROVED) {
    throw new Error("承認済み草案のみ公開できます。");
  }

  if (draft.published) {
    await prisma.examQuestion.update({
      where: { questionDraftId: id },
      data: {
        publishStatus: QuestionPublishStatus.ACTIVE,
      },
    });
  } else {
    await prisma.examQuestion.create({
      data: {
        questionDraftId: id,
        publishStatus: QuestionPublishStatus.ACTIVE,
      },
    });
  }

  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath("/quiz");
}

export async function unpublishDraft(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("草案IDがありません。");
  }

  const existing = await prisma.examQuestion.findUnique({
    where: { questionDraftId: id },
  });

  if (!existing) {
    return;
  }

  await prisma.examQuestion.update({
    where: { questionDraftId: id },
    data: {
      publishStatus: QuestionPublishStatus.INACTIVE,
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
      published: true,
      learningPoint: true,
    },
  });

  if (!draft) {
    throw new Error("草案が見つかりません");
  }

  if (draft.published && draft.published.publishStatus === "ACTIVE") {
    throw new Error("公開中の問題は削除できません。先に公開停止してください。");
  }

  await prisma.questionDraft.delete({
    where: { id },
  });

  revalidatePath("/admin/drafts");
  revalidatePath(redirectTo);

  redirect(redirectTo);
}
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const loginId = formData.get("loginId") as string;
  const password = formData.get("password") as string;

  if (!loginId || !password) {
    throw new Error("LoginID / Password が必要です");
  }

  const user = await prisma.user.findUnique({
    where: { loginId },
  });

  if (!user) {
    throw new Error("ユーザーが存在しません");
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new Error("パスワードが一致しません");
  }

  await createSession(user.id, user.loginId, user.role);

  if (user.role === "ADMIN" || user.role === "EDITOR") {
    redirect("/admin/drafts");
  } else {
    redirect("/");
  }
}

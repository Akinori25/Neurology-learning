"use server";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const sessionCookie = (await cookies()).get("session")?.value;
  const session = await decrypt(sessionCookie);
  if (!session) throw new Error("Unauthorized");
  return session.userId;
}

export async function updateProfile(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get("name") as string;
  
  if (!name.trim()) throw new Error("名前を入力してください。");

  await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  });

  revalidatePath("/account");
}

export async function updatePassword(formData: FormData) {
  const userId = await getUserId();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) throw new Error("現在のパスワードが間違っています。");

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}

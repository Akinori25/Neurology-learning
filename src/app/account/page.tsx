import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import AccountSettingsClient from "./AccountSettingsClient";
import Link from "next/link";

export default async function AccountPage() {
  const sessionCookie = (await cookies()).get("session")?.value;
  const session = await decrypt(sessionCookie);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-6 mt-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">アカウント設定</h1>
        <Link 
          href="/" 
          className="rounded-xl border px-4 py-2 hover:bg-gray-50 text-sm font-medium"
        >
          学習トップへ戻る
        </Link>
      </div>
      <AccountSettingsClient user={user} />
    </main>
  );
}

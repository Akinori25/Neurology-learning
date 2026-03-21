"use client";

import { useTransition } from "react";
import { logout } from "./actions";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
    >
      {isPending ? "処理中..." : "ログアウト"}
    </button>
  );
}

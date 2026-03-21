"use client";

import { useTransition, useState } from "react";
import { updateProfile, updatePassword } from "./actions";

export default function AccountSettingsClient({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  const handleProfileSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateProfile(formData);
        setProfileMsg("名前を更新しました。");
      } catch (err: any) {
        setProfileMsg(err.message || "エラーが発生しました");
      }
    });
  };

  const handlePasswordSubmit = (formData: FormData) => {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (newPassword !== confirmPassword) {
      setPassMsg("新しいパスワードと確認用パスワードが一致しません。");
      return;
    }

    if (newPassword.length < 4) {
      setPassMsg("新しいパスワードが短すぎます。");
      return;
    }

    startTransition(async () => {
      try {
        await updatePassword(formData);
        setPassMsg("パスワードを更新しました。");
      } catch (err: any) {
        setPassMsg(err.message || "エラーが発生しました");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">プロフィール設定</h2>
        <form action={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">ログインID</label>
            <input 
              type="text" 
              value={user.loginId} 
              disabled 
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed" 
            />
            <p className="text-xs text-slate-500 mt-1">※ログインIDは変更できません</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ユーザー名</label>
            <input 
              name="name" 
              type="text" 
              defaultValue={user.name} 
              required 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-100 outline-none" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            名前を保存
          </button>
          {profileMsg && <p className="text-sm font-medium text-sky-600">{profileMsg}</p>}
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">パスワード変更</h2>
        <form action={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">現在のパスワード</label>
            <input 
              name="currentPassword" 
              type="password" 
              required 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none mb-1" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">新しいパスワード</label>
            <input 
              name="newPassword" 
              type="password" 
              required 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none mb-1" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">新しいパスワード (確認)</label>
            <input 
              name="confirmPassword" 
              type="password" 
              required 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none mb-4" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            パスワードを変更
          </button>
          {passMsg && <p className={`text-sm font-medium mt-2 ${passMsg.includes("更新しました") ? "text-sky-600" : "text-rose-600"}`}>{passMsg}</p>}
        </form>
      </section>
    </div>
  );
}

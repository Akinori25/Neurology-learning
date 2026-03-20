import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          サインイン
        </h1>

        <form action={loginAction} className="space-y-4">
          <div>
            <label
              htmlFor="loginId"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              LoginID
            </label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              required
              className="w-full rounded-xl border px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            ログイン
          </button>
        </form>
      </div>
    </main>
  );
}

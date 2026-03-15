import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          神経内科専門医試験アプリ
        </h1>
        <p className="text-gray-500">
          Neurology Board Exam Training
        </p>
      </header>

      <section className="space-y-4">
        <Link
          href="/quiz"
          className="block rounded-2xl bg-blue-600 px-6 py-4 text-center text-white text-lg font-semibold hover:bg-blue-700 transition"
        >
          演習を開始
        </Link>
      </section>

      <section className="grid md:grid-cols-2 gap-4">

        <Link
          href="/quiz?mode=random"
          className="rounded-xl border p-5 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold">ランダム演習</h2>
          <p className="text-sm text-gray-500">
            すべての問題からランダム出題
          </p>
        </Link>

        <Link
          href="/quiz?mode=topic"
          className="rounded-xl border p-5 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold">トピック別演習</h2>
          <p className="text-sm text-gray-500">
            神経筋 / 脳血管 / 認知症など
          </p>
        </Link>

      </section>

      <section className="border-t pt-6">
        <h2 className="mb-3 font-semibold text-gray-700">
          管理
        </h2>

        <div className="flex gap-4 text-sm">

          <Link
            href="/admin"
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            管理画面
          </Link>

          <Link
            href="/admin/learning-points"
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Learning Points
          </Link>

        </div>
      </section>

    </main>
  );
}
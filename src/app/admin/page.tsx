import Link from "next/link";

export default async function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">管理ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-500">
            問題作成、公開、資料管理
          </p>
        </div>
        <Link 
          href="/" 
          className="rounded-xl border px-4 py-2 hover:bg-gray-50 text-sm font-medium"
        >
          学習トップへ戻る
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/learning-points"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">論点管理</h2>
          <p className="mt-2 text-sm text-gray-500">
            論点の一覧、追加、編集、問題生成の起点
          </p>
        </Link>

        <Link
          href="/admin/drafts"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">問題草案</h2>
          <p className="mt-2 text-sm text-gray-500">
            草案の確認、公開、非公開、再編集
          </p>
        </Link>

        <Link
          href="/admin/images"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">画像管理</h2>
          <p className="mt-2 text-sm text-gray-500">
            画像の登録、所見メタデータ管理、画像問題用素材の管理
          </p>
        </Link>

        <Link
          href="/admin/sources"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">資料管理</h2>
          <p className="mt-2 text-sm text-gray-500">
            教科書、ガイドライン、論文などの参照元管理
          </p>
        </Link>

        <Link
          href="/admin/question-sets"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">問題集管理</h2>
          <p className="mt-2 text-sm text-gray-500">
            問題集の作成、編集、公開済み問題の収載管理
          </p>
        </Link>

        <Link
          href="/admin/exam"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold text-emerald-700">模擬試験管理</h2>
          <p className="mt-2 text-sm text-gray-500">
            模擬試験の構成、公開状態、推定成績の管理
          </p>
        </Link>
      </div>
    </main>
  );
}
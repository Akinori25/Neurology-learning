import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatStatus(status: string) {
  switch (status) {
    case "DRAFT":
      return "下書き";
    case "APPROVED":
      return "承認済み";
    case "REJECTED":
      return "却下";
    default:
      return status;
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200";
    case "DRAFT":
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function DraftsPage() {
  const drafts = await prisma.questionDraft.findMany({
    include: {
      learningPoint: true,
      imageAsset: true,
      published: true,
      citations: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">問題草案</h1>
          <p className="mt-2 text-sm text-gray-500">
            草案の確認、承認状況の把握、詳細画面への遷移
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          管理ダッシュボードへ戻る
        </Link>
      </div>

      {drafts.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p>問題草案がありません。</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">問題文</th>
                  <th className="px-4 py-3 font-semibold">論点</th>
                  <th className="px-4 py-3 font-semibold">形式</th>
                  <th className="px-4 py-3 font-semibold">難易度</th>
                  <th className="px-4 py-3 font-semibold">画像</th>
                  <th className="px-4 py-3 font-semibold">根拠</th>
                  <th className="px-4 py-3 font-semibold">状態</th>
                  <th className="px-4 py-3 font-semibold">公開</th>
                  <th className="px-4 py-3 font-semibold">更新日時</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>

              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <p className="line-clamp-2 font-medium leading-6">
                          {draft.stem}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          v{draft.version}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {draft.learningPoint.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {draft.learningPoint.topic}
                          {draft.learningPoint.subtopic
                            ? ` / ${draft.learningPoint.subtopic}`
                            : ""}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {draft.learningPoint.questionStyle}
                    </td>

                    <td className="px-4 py-4">
                      {draft.learningPoint.difficulty}
                    </td>

                    <td className="px-4 py-4">
                      {draft.hasImage && draft.imageAsset ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full border bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            あり
                          </span>
                          <p className="max-w-[180px] text-xs text-gray-500">
                            {draft.imageAsset.title}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                          なし
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        {draft.citations.length}件
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                          draft.status
                        )}`}
                      >
                        {formatStatus(draft.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {draft.published ? (
                        <span className="inline-flex rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700">
                          公開中
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                          未公開
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(draft.updatedAt)}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/drafts/${draft.id}`}
                        className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                      >
                        詳細を見る
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
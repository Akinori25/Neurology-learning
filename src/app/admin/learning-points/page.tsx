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

function formatDifficulty(value: string) {
  switch (value) {
    case "BASIC":
      return "基本";
    case "STANDARD":
      return "標準";
    case "HARD":
      return "難";
    default:
      return value;
  }
}

function formatQuestionStyle(value: string) {
  switch (value) {
    case "FACT":
      return "知識";
    case "CASE":
      return "症例";
    case "DIFFERENTIAL":
      return "鑑別";
    case "TREATMENT":
      return "治療";
    case "IMAGE":
      return "画像";
    default:
      return value;
  }
}

export default async function LearningPointsPage() {
  const learningPoints = await prisma.learningPoint.findMany({
    include: {
      source: true,
      drafts: true,
      imageLinks: {
        include: {
          imageAsset: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex gap-3">
        <Link
          href="/admin/learning-points/new"
          className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
        >
          新規追加
        </Link>

        <Link
          href="/admin/learning-points/generate"
          className="rounded-xl border border-purple-300 bg-purple-50 px-4 py-2 text-sm text-purple-700 hover:bg-purple-100"
        >
          LLM候補生成
        </Link>

        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          管理ダッシュボードへ戻る
        </Link>
      </div>

      {learningPoints.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p>論点がありません。</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">タイトル</th>
                  <th className="px-4 py-3 font-semibold">分野</th>
                  <th className="px-4 py-3 font-semibold">形式</th>
                  <th className="px-4 py-3 font-semibold">難易度</th>
                  <th className="px-4 py-3 font-semibold">画像候補</th>
                  <th className="px-4 py-3 font-semibold">草案数</th>
                  <th className="px-4 py-3 font-semibold">状態</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>

              <tbody>
                {learningPoints.map((lp) => (
                  <tr key={lp.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <p className="font-medium">{lp.title}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                          {lp.learningPoint}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p>{lp.topic}</p>
                        <p className="text-xs text-gray-500">
                          {lp.subtopic ?? "サブトピック未設定"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {formatQuestionStyle(lp.questionStyle)}
                    </td>

                    <td className="px-4 py-4">
                      {formatDifficulty(lp.difficulty)}
                    </td>

                    <td className="px-4 py-4">
                      {lp.imageLinks.length > 0 ? (
                        <span className="inline-flex rounded-full border bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          {lp.imageLinks.length}件
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                          なし
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        {lp.drafts.length}件
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                          lp.status
                        )}`}
                      >
                        {formatStatus(lp.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/learning-points/${lp.id}`}
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
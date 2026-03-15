import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatDifficulty(value: string) {
  switch (value) {
    case "CORE":
      return "CORE";
    case "STANDARD":
      return "STANDARD";
    case "HARD":
      return "HARD";
    case "INSANE":
      return "INSANE";
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

function formatOrigin(value: string) {
  switch (value) {
    case "MANUAL":
      return "手動";
    case "LLM":
      return "LLM";
    case "SOURCE_LLM":
      return "資料LLM";
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
      <div className="mb-6 flex gap-3">
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
                  <th className="px-4 py-3 font-semibold">作成方法</th>
                  <th className="px-4 py-3 font-semibold">画像候補</th>
                  <th className="px-4 py-3 font-semibold">草案数</th>
                  <th className="px-4 py-3 font-semibold">公開草案</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>

              <tbody>
                {learningPoints.map((lp) => {
                  const publishedDraftCount = lp.drafts.filter(
                    (draft) => draft.isPublished
                  ).length;

                  return (
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
                        <span className="inline-flex rounded-full border bg-purple-50 px-2 py-1 text-xs text-purple-700">
                          {formatOrigin(lp.origin)}
                        </span>
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
                        <span className="inline-flex rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700">
                          {publishedDraftCount}件
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
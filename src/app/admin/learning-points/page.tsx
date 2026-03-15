import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/learning-points/new"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-4 text-sm text-blue-700 hover:bg-blue-100"
        >
          新規追加
        </Link>

        <Link
          href="/admin/learning-points/generate"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-purple-300 bg-purple-50 px-4 text-sm text-purple-700 hover:bg-purple-100"
        >
          LLM候補生成
        </Link>

        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          管理ダッシュボードへ戻る
        </Link>
      </div>

      {learningPoints.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p>論点がありません。</p>
        </section>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 lg:hidden">
            {learningPoints.map((lp) => {
              const publishedDraftCount = lp.drafts.filter(
                (draft) => draft.isPublished
              ).length;

              return (
                <section
                  key={lp.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{lp.title}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {lp.learningPoint}
                      </p>
                    </div>

                    <Link
                      href={`/admin/learning-points/${lp.id}`}
                      className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs font-medium hover:bg-gray-50"
                    >
                      詳細
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-900">{lp.topic}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {lp.subtopic ?? "サブトピック未設定"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        {formatQuestionStyle(lp.questionStyle)}
                      </span>
                      <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        {formatDifficulty(lp.difficulty)}
                      </span>
                      <span className="inline-flex rounded-full border bg-purple-50 px-2 py-1 text-xs text-purple-700">
                        {formatOrigin(lp.origin)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3 text-xs">
                      <div>
                        <p className="text-gray-500">画像候補</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {lp.imageLinks.length}件
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">草案数</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {lp.drafts.length}件
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">公開草案</p>
                        <p className="mt-1 font-medium text-green-700">
                          {publishedDraftCount}件
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Desktop table */}
          <section className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm lg:block">
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
                          <span className="inline-flex whitespace-nowrap rounded-full border bg-purple-50 px-2 py-1 text-xs text-purple-700">
                            {formatOrigin(lp.origin)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {lp.imageLinks.length > 0 ? (
                            <span className="inline-flex whitespace-nowrap rounded-full border bg-blue-50 px-2 py-1 text-xs text-blue-700">
                              {lp.imageLinks.length}件
                            </span>
                          ) : (
                            <span className="inline-flex whitespace-nowrap rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                              なし
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                            {lp.drafts.length}件
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700">
                            {publishedDraftCount}件
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/learning-points/${lp.id}`}
                            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs hover:bg-gray-50"
                          >
                            詳細
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
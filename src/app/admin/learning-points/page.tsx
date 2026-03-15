import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type LearningPointsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

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

function buildPageHref(page: number) {
  return page <= 1
    ? "/admin/learning-points"
    : `/admin/learning-points?page=${page}`;
}

export default async function LearningPointsPage({
  searchParams,
}: LearningPointsPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);

  const [totalCount, learningPoints] = await Promise.all([
    prisma.learningPoint.count(),
    prisma.learningPoint.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        learningPoint: true,
        topic: true,
        subtopic: true,
        questionStyle: true,
        difficulty: true,
        origin: true,
        _count: {
          select: {
            imageLinks: true,
            drafts: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, totalCount);

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

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded-full border bg-gray-50 px-2 py-1">
          {pageStart}-{pageEnd} / {totalCount}件
        </span>
      </div>

      {learningPoints.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p>論点がありません。</p>
        </section>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 lg:hidden">
            {learningPoints.map((lp) => (
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

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-xs">
                    <div>
                      <p className="text-gray-500">画像候補</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {lp._count.imageLinks}件
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">草案数</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {lp._count.drafts}件
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ))}
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
                        <span className="inline-flex whitespace-nowrap rounded-full border bg-purple-50 px-2 py-1 text-xs text-purple-700">
                          {formatOrigin(lp.origin)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {lp._count.imageLinks > 0 ? (
                          <span className="inline-flex whitespace-nowrap rounded-full border bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            {lp._count.imageLinks}件
                          </span>
                        ) : (
                          <span className="inline-flex whitespace-nowrap rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                            なし
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex whitespace-nowrap rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                          {lp._count.drafts}件
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
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <nav className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {pageStart}-{pageEnd} / {totalCount}件
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                href={buildPageHref(Math.max(1, safePage - 1))}
                className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm ${
                  safePage <= 1
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-gray-50"
                }`}
              >
                前へ
              </Link>

              <span className="inline-flex h-10 items-center justify-center rounded-lg border bg-gray-50 px-4 text-sm text-gray-700">
                {safePage} / {totalPages}
              </span>

              <Link
                href={buildPageHref(Math.min(totalPages, safePage + 1))}
                className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm ${
                  safePage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-gray-50"
                }`}
              >
                次へ
              </Link>
            </div>
          </nav>
        </>
      )}
    </main>
  );
}
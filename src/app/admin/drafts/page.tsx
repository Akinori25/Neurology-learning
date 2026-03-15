import Link from "next/link";
import { Prisma, Difficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DraftsPageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
    sort?: string;
  }>;
};

const DIFFICULTY_OPTIONS: Difficulty[] = [
  "CORE",
  "STANDARD",
  "HARD",
  "INSANE",
];

function isDifficulty(value: string | undefined): value is Difficulty {
  return !!value && DIFFICULTY_OPTIONS.includes(value as Difficulty);
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

function formatQuestionStyle(style: string) {
  switch (style) {
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
      return style;
  }
}

function formatDifficulty(difficulty: string) {
  switch (difficulty) {
    case "CORE":
      return "CORE";
    case "STANDARD":
      return "STANDARD";
    case "HARD":
      return "HARD";
    case "INSANE":
      return "INSANE";
    default:
      return difficulty;
  }
}

function formatLearningPointOrigin(origin: string) {
  switch (origin) {
    case "MANUAL":
      return "手動";
    case "LLM":
      return "LLM";
    case "SOURCE_LLM":
      return "資料LLM";
    default:
      return origin;
  }
}

function sortLabel(sort: string) {
  switch (sort) {
    case "updated_asc":
      return "更新日時 ↑";
    case "good_desc":
      return "Good数 ↓";
    case "good_asc":
      return "Good数 ↑";
    case "raise_desc":
      return "挙手数 ↓";
    case "raise_asc":
      return "挙手数 ↑";
    case "updated_desc":
    default:
      return "更新日時 ↓";
  }
}

export default async function DraftsPage({ searchParams }: DraftsPageProps) {
  const params = (await searchParams) ?? {};

  const selectedTopic = params.topic?.trim() || "";
  const selectedDifficulty = isDifficulty(params.difficulty)
    ? params.difficulty
    : "";
  const sort = params.sort?.trim() || "updated_desc";

  const where: Prisma.QuestionDraftWhereInput = {
    ...(selectedTopic || selectedDifficulty
      ? {
          learningPoint: {
            ...(selectedTopic ? { topic: selectedTopic } : {}),
            ...(selectedDifficulty ? { difficulty: selectedDifficulty } : {}),
          },
        }
      : {}),
  };

  const topicsRaw = await prisma.learningPoint.findMany({
    select: { topic: true },
    distinct: ["topic"],
    orderBy: { topic: "asc" },
  });

  const topics = topicsRaw.map((item) => item.topic);

  const draftsRaw = await prisma.questionDraft.findMany({
    where,
    include: {
      learningPoint: true,
      imageAsset: true,
      citations: {
        select: { id: true },
      },
      setItems: {
        select: { id: true },
      },
      _count: {
        select: {
          goods: true,
          raiseHands: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const drafts = [...draftsRaw].sort((a, b) => {
    switch (sort) {
      case "updated_asc":
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      case "good_desc":
        return (
          b._count.goods - a._count.goods ||
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
      case "good_asc":
        return (
          a._count.goods - b._count.goods ||
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
      case "raise_desc":
        return (
          b._count.raiseHands - a._count.raiseHands ||
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
      case "raise_asc":
        return (
          a._count.raiseHands - b._count.raiseHands ||
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
      case "updated_desc":
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  const stats = {
    totalDrafts: drafts.length,
    publishedDrafts: drafts.filter((draft) => draft.isPublished).length,
    totalGoods: drafts.reduce((sum, draft) => sum + draft._count.goods, 0),
    totalRaiseHands: drafts.reduce(
      (sum, draft) => sum + draft._count.raiseHands,
      0
    ),
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">問題草案</h1>
          <p className="mt-2 text-sm text-gray-500">
            草案の確認、公開状況の把握、詳細画面への遷移
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          管理ダッシュボードへ戻る
        </Link>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">草案数</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.totalDrafts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">公開中</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {stats.publishedDrafts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Good総数</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {stats.totalGoods}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">挙手総数</p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">
            {stats.totalRaiseHands}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              分野
            </label>
            <select
              name="topic"
              defaultValue={selectedTopic}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">すべて</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              難易度
            </label>
            <select
              name="difficulty"
              defaultValue={selectedDifficulty}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">すべて</option>
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {formatDifficulty(difficulty)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              並び順
            </label>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="updated_desc">更新日時 ↓</option>
              <option value="updated_asc">更新日時 ↑</option>
              <option value="good_desc">Good数 ↓</option>
              <option value="good_asc">Good数 ↑</option>
              <option value="raise_desc">挙手数 ↓</option>
              <option value="raise_asc">挙手数 ↑</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              絞り込む
            </button>
            <Link
              href="/admin/drafts"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              リセット
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-full border bg-gray-50 px-2 py-1">
            分野: {selectedTopic || "すべて"}
          </span>
          <span className="rounded-full border bg-gray-50 px-2 py-1">
            難易度: {selectedDifficulty || "すべて"}
          </span>
          <span className="rounded-full border bg-gray-50 px-2 py-1">
            並び順: {sortLabel(sort)}
          </span>
        </div>
      </section>

      {drafts.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p>条件に一致する問題草案がありません。</p>
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
                  <th className="px-4 py-3 font-semibold">作成方法</th>
                  <th className="px-4 py-3 font-semibold">画像</th>
                  <th className="px-4 py-3 font-semibold">根拠</th>
                  <th className="px-4 py-3 font-semibold">反応</th>
                  <th className="px-4 py-3 font-semibold">問題集</th>
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
                        <p className="font-medium">{draft.learningPoint.title}</p>
                        <p className="text-xs text-gray-500">
                          {draft.learningPoint.topic}
                          {draft.learningPoint.subtopic
                            ? ` / ${draft.learningPoint.subtopic}`
                            : ""}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {formatQuestionStyle(draft.learningPoint.questionStyle)}
                    </td>

                    <td className="px-4 py-4">
                      {formatDifficulty(draft.learningPoint.difficulty)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border bg-purple-50 px-2 py-1 text-xs text-purple-700">
                        {formatLearningPointOrigin(draft.learningPoint.origin)}
                      </span>
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
                      <div className="space-y-1">
                        <div>
                          <span className="inline-flex rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700">
                            Good {draft._count.goods}
                          </span>
                        </div>
                        <div>
                          <span className="inline-flex rounded-full border bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
                            挙手 {draft._count.raiseHands}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                        {draft.setItems.length}件
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {draft.isPublished ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700">
                            公開中
                          </span>
                          <p className="text-xs text-gray-500">
                            {draft.publishedAt
                              ? formatDate(draft.publishedAt)
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-500">
                          下書き
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
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
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [
    learningPointCount,
    draftCount,
    publishedDraftCount,
    imageCount,
    sourceCount,
    userAttemptCount,
    imageQuestionCount,
    questionSetCount,
    goodCount,
    raiseHandCount,
  ] = await Promise.all([
    prisma.learningPoint.count(),
    prisma.questionDraft.count(),
    prisma.questionDraft.count({
      where: { isPublished: true },
    }),
    prisma.imageAsset.count(),
    prisma.source.count(),
    prisma.userAttempt.count(),
    prisma.questionDraft.count({
      where: { hasImage: true },
    }),
    prisma.questionSet.count(),
    prisma.draftGood.count(),
    prisma.draftRaiseHand.count(),
  ]);

  const stats = [
    { label: "論点数", value: learningPointCount },
    { label: "問題草案数", value: draftCount },
    { label: "公開問題数", value: publishedDraftCount },
    { label: "問題集数", value: questionSetCount },
    { label: "画像数", value: imageCount },
    { label: "資料数", value: sourceCount },
    { label: "回答数", value: userAttemptCount },
    { label: "画像問題数", value: imageQuestionCount },
    { label: "Good数", value: goodCount },
    { label: "挙手数", value: raiseHandCount },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-gray-500">
          問題作成、公開、資料管理の概要
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <section
            key={stat.label}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
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
      </div>
    </main>
  );
}
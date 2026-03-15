import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GenerateDraftButton } from "@/components/admin/LearningPointActionButtons";
import { generateDraftFromLearningPoint, deleteLearningPoint } from "./actions";
import { DeleteLearningPointButton } from "@/components/admin/DeleteLearningPointButton";

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
      return "手動作成";
    case "LLM":
      return "LLM生成";
    case "SOURCE_LLM":
      return "資料読込LLM生成";
    default:
      return value;
  }
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function LearningPointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const learningPoint = await prisma.learningPoint.findUnique({
    where: { id },
    include: {
      source: true,
      imageLinks: {
        include: {
          imageAsset: true,
        },
      },
      drafts: {
        include: {
          imageAsset: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!learningPoint) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">論点の詳細</h1>
          <p className="mt-2 text-sm text-gray-500">
            論点の内容確認と草案生成
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <GenerateDraftButton
              action={generateDraftFromLearningPoint}
              learningPointId={learningPoint.id}
            />
            <Link
              href={`/admin/learning-points/${learningPoint.id}/edit`}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              編集
            </Link>
            <DeleteLearningPointButton
              action={deleteLearningPoint}
              learningPointId={learningPoint.id}
            />
          </div>
        </div>

        <Link
          href="/admin/learning-points"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          論点一覧へ戻る
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                {formatQuestionStyle(learningPoint.questionStyle)}
              </span>
              <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                {formatDifficulty(learningPoint.difficulty)}
              </span>
              <span className="rounded-full border bg-purple-50 px-3 py-1 text-xs text-purple-700">
                {formatOrigin(learningPoint.origin)}
              </span>
            </div>

            <h2 className="mb-4 text-xl font-semibold">{learningPoint.title}</h2>

            <div className="rounded-xl border bg-gray-50 p-4 text-sm leading-7">
              {learningPoint.learningPoint}
            </div>

            {learningPoint.rationale && (
              <div className="mt-4 rounded-xl border bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold">論点の意図</h3>
                <p className="text-sm leading-7">{learningPoint.rationale}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">
              この論点から作られた草案
            </h3>

            {learningPoint.drafts.length === 0 ? (
              <p className="text-sm text-gray-500">まだ草案はありません。</p>
            ) : (
              <div className="space-y-4">
                {learningPoint.drafts.map((draft) => (
                  <div key={draft.id} className="rounded-xl border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={
                          draft.isPublished
                            ? "rounded-full border bg-green-50 px-2 py-1 text-xs text-green-700"
                            : "rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700"
                        }
                      >
                        {draft.isPublished ? "公開中" : "下書き"}
                      </span>
                      {draft.hasImage && (
                        <span className="rounded-full border bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          画像問題
                        </span>
                      )}
                      <span className="rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        v{draft.version}
                      </span>
                    </div>

                    <p className="font-medium leading-7">{draft.stem}</p>

                    <div className="mt-2 text-xs text-gray-500">
                      更新: {formatDate(draft.updatedAt)}
                      {draft.isPublished && (
                        <>
                          {" "}
                          / 公開: {formatDate(draft.publishedAt)}
                        </>
                      )}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/admin/drafts/${draft.id}`}
                        className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                      >
                        草案詳細を見る
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">基本情報</h3>
            <div className="space-y-2 text-sm leading-6">
              <p>
                <span className="font-medium">トピック:</span> {learningPoint.topic}
              </p>
              <p>
                <span className="font-medium">サブトピック:</span>{" "}
                {learningPoint.subtopic ?? "未設定"}
              </p>
              <p>
                <span className="font-medium">タグ:</span>{" "}
                {learningPoint.tags.length > 0
                  ? learningPoint.tags.join(", ")
                  : "なし"}
              </p>
              <p>
                <span className="font-medium">資料:</span>{" "}
                {learningPoint.source?.title ?? "未設定"}
              </p>
              <p>
                <span className="font-medium">作成方法:</span>{" "}
                {formatOrigin(learningPoint.origin)}
              </p>
              <p>
                <span className="font-medium">最終生成:</span>{" "}
                {formatDate(learningPoint.lastGeneratedAt)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">候補画像</h3>

            {learningPoint.imageLinks.length === 0 ? (
              <p className="text-sm text-gray-500">候補画像はありません。</p>
            ) : (
              <div className="space-y-4">
                {learningPoint.imageLinks.map((link) => (
                  <div key={link.id} className="rounded-xl border p-4">
                    <p className="font-medium">{link.imageAsset.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {link.imageAsset.modality} / {link.imageAsset.topic}
                      {link.imageAsset.subtopic
                        ? ` / ${link.imageAsset.subtopic}`
                        : ""}
                    </p>
                    {link.imageAsset.findings && (
                      <p className="mt-3 text-sm leading-7">
                        {link.imageAsset.findings}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
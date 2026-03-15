import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  approveDraft,
  rejectDraft,
  publishDraft,
  unpublishDraft,
  deleteDraft,
} from "./actions";
import { ActionButton } from "@/components/admin/DraftActionButtons";

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function cardClassName() {
  return "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
}

function sectionTitleClassName() {
  return "mb-4 text-lg font-semibold text-gray-900";
}

function actionLinkClassName() {
  return "inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50";
}

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const draft = await prisma.questionDraft.findUnique({
    where: { id },
    include: {
      learningPoint: true,
      imageAsset: true,
      published: true,
      citations: {
        include: {
          sourceChunk: {
            include: {
              source: true,
            },
          },
        },
      },
    },
  });

  if (!draft) notFound();

  const choices = [
    { key: "A", text: draft.choiceA },
    { key: "B", text: draft.choiceB },
    { key: "C", text: draft.choiceC },
    { key: "D", text: draft.choiceD },
  ];

  const isPublished = draft.published?.publishStatus === "ACTIVE";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              問題草案の詳細
            </h1>
            <p className="text-sm leading-6 text-gray-500">
              草案内容、画像、根拠、公開状況の確認
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:w-52">
            <Link href="/admin/drafts" className={actionLinkClassName()}>
              <div className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              草案一覧へ戻る
              </div>
            </Link>
            <Link
              href={`/admin/learning-points/${draft.learningPoint.id}`}
              className={actionLinkClassName()}
            >
              <div className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              論点詳細へ
              </div>
            </Link>
          </div>
        </section>

        {/* Primary actions */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/drafts/${draft.id}/edit`}
              className={actionLinkClassName()}
            >
              編集
            </Link>

            <ActionButton
              action={approveDraft}
              id={draft.id}
              label="承認"
              className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition hover:bg-green-100"
            />

            <ActionButton
              action={rejectDraft}
              id={draft.id}
              label="却下"
              className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
            />

            {isPublished ? (
              <ActionButton
                action={unpublishDraft}
                id={draft.id}
                label="公開停止"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
              />
            ) : (
              <ActionButton
                action={publishDraft}
                id={draft.id}
                label="公開"
                className="inline-flex items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
              />
            )}

            <ActionButton
              action={deleteDraft}
              id={draft.id}
              label="削除して草案一覧へ戻る"
              redirectTo="/admin/drafts"
              confirmMessage="この草案を削除しますか？この操作は元に戻せません。"
              className="inline-flex items-center justify-center rounded-xl border border-red-400 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
            />

            <ActionButton
              action={deleteDraft}
              id={draft.id}
              label="削除して論点詳細へ戻る"
              redirectTo={`/admin/learning-points/${draft.learningPointId}`}
              confirmMessage="この草案を削除しますか？この操作は元に戻せません。"
              className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
            />
          </div>
        </section>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* Left column */}
          <div className="space-y-6">
            <section className={cardClassName()}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  {formatStatus(draft.status)}
                </span>

                {isPublished && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    公開中
                  </span>
                )}

                {draft.hasImage && draft.imageAsset && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    画像問題
                  </span>
                )}
              </div>

              <h2 className="mb-6 text-2xl font-semibold leading-9 text-gray-900">
                {draft.stem}
              </h2>

              {draft.imageAsset && (
                <div className="mb-6">
                  <img
                    src={draft.imageAsset.fileUrl}
                    alt={draft.imageAsset.title}
                    className="max-h-[420px] rounded-xl border border-gray-200"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {draft.imageAsset.title}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {choices.map((choice) => {
                  const isCorrect = choice.key === draft.correctAnswer;

                  return (
                    <div
                      key={choice.key}
                      className={
                        isCorrect
                          ? "rounded-xl border border-green-300 bg-green-50 px-4 py-3"
                          : "rounded-xl border border-gray-200 bg-white px-4 py-3"
                      }
                    >
                      <p className="text-sm font-medium leading-6 text-gray-900">
                        {choice.key}. {choice.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-900">
                  全体解説
                </h3>
                <p className="text-sm leading-7 text-gray-800">
                  {draft.explanation}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    各選択肢の解説
                  </h3>
                  <div className="space-y-3 text-sm leading-6 text-gray-700">
                    <p><span className="font-medium text-gray-900">A:</span> {draft.explanationA ?? "未記載"}</p>
                    <p><span className="font-medium text-gray-900">B:</span> {draft.explanationB ?? "未記載"}</p>
                    <p><span className="font-medium text-gray-900">C:</span> {draft.explanationC ?? "未記載"}</p>
                    <p><span className="font-medium text-gray-900">D:</span> {draft.explanationD ?? "未記載"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    生成情報
                  </h3>
                  <div className="space-y-2 text-sm leading-6 text-gray-700">
                    <p><span className="font-medium text-gray-900">モデル:</span> {draft.llmModel ?? "未設定"}</p>
                    <p><span className="font-medium text-gray-900">Prompt version:</span> {draft.promptVersion ?? "未設定"}</p>
                    <p><span className="font-medium text-gray-900">更新日時:</span> {formatDate(draft.updatedAt)}</p>
                    <p><span className="font-medium text-gray-900">版:</span> v{draft.version}</p>

                    {draft.generationMeta &&
                      typeof draft.generationMeta === "object" &&
                      !Array.isArray(draft.generationMeta) && (
                        <>
                          <p><span className="font-medium text-gray-900">取得chunk数:</span> {"retrievedChunkCount" in draft.generationMeta ? String(draft.generationMeta.retrievedChunkCount) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">根拠資料あり:</span> {"hasEvidence" in draft.generationMeta ? String(draft.generationMeta.hasEvidence) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">監査実施:</span> {"audited" in draft.generationMeta ? String(draft.generationMeta.audited) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">監査補正:</span> {"auditCorrected" in draft.generationMeta ? String(draft.generationMeta.auditCorrected) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">生成時刻:</span> {"generatedAt" in draft.generationMeta ? String(draft.generationMeta.generatedAt) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">難易度スコア:</span> {"difficultyScore" in draft.generationMeta ? String(draft.generationMeta.difficultyScore) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">医学的妥当性:</span> {"clinicalAccuracyScore" in draft.generationMeta ? String(draft.generationMeta.clinicalAccuracyScore) : "不明"}</p>
                          <p><span className="font-medium text-gray-900">弁別性:</span> {"discriminationScore" in draft.generationMeta ? String(draft.generationMeta.discriminationScore) : "不明"}</p>

                          {"auditReason" in draft.generationMeta && (
                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="mb-1 text-sm font-medium text-gray-900">
                                監査理由
                              </p>
                              <p className="text-sm leading-6 text-gray-700">
                                {String(draft.generationMeta.auditReason)}
                              </p>
                            </div>
                          )}

                          <details className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <summary className="cursor-pointer text-sm font-medium text-gray-900">
                              generationMeta の詳細
                            </summary>
                            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-gray-700">
                              {JSON.stringify(draft.generationMeta, null, 2)}
                            </pre>
                          </details>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {draft.reviewerComment && (
                <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-yellow-900">
                    レビューコメント
                  </h3>
                  <p className="text-sm leading-7 text-gray-800">
                    {draft.reviewerComment}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <section className={cardClassName()}>
              <h3 className={sectionTitleClassName()}>論点情報</h3>

              <div className="grid gap-4 text-sm sm:grid-cols-1">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">タイトル</p>
                  <p className="mt-1 text-sm text-gray-900">{draft.learningPoint.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">トピック</p>
                  <p className="mt-1 text-sm text-gray-900">{draft.learningPoint.topic}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">サブトピック</p>
                  <p className="mt-1 text-sm text-gray-900">{draft.learningPoint.subtopic ?? "未設定"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">形式</p>
                  <p className="mt-1 text-sm text-gray-900">{draft.learningPoint.questionStyle}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">難易度</p>
                  <p className="mt-1 text-sm text-gray-900">{draft.learningPoint.difficulty}</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-700">
                {draft.learningPoint.learningPoint}
              </div>
            </section>

            {draft.imageAsset && (
              <section className={cardClassName()}>
                <h3 className={sectionTitleClassName()}>画像メタデータ</h3>
                <div className="space-y-3 text-sm leading-6 text-gray-700">
                  <p><span className="font-medium text-gray-900">タイトル:</span> {draft.imageAsset.title}</p>
                  <p><span className="font-medium text-gray-900">モダリティ:</span> {draft.imageAsset.modality}</p>
                  <p><span className="font-medium text-gray-900">診断:</span> {draft.imageAsset.diagnosis ?? "未設定"}</p>
                  <p><span className="font-medium text-gray-900">所見:</span> {draft.imageAsset.findings ?? "未設定"}</p>
                </div>
              </section>
            )}

            <section className={cardClassName()}>
              <h3 className={sectionTitleClassName()}>根拠資料</h3>

              {draft.citations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  根拠資料の紐付けはありません。
                </p>
              ) : (
                <div className="space-y-4">
                  {draft.citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {citation.sourceChunk.source.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {citation.sourceChunk.chapter ?? "章未設定"}
                        {citation.sourceChunk.pageStart
                          ? ` / p.${citation.sourceChunk.pageStart}`
                          : ""}
                        {citation.note ? ` / ${citation.note}` : ""}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-gray-700">
                        {citation.sourceChunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
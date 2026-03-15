import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateDraft } from "./actions";

export default async function DraftEditPage({
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
    },
  });

  if (!draft) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">問題草案を編集</h1>
          <p className="mt-2 text-sm text-gray-500">
            草案内容を修正して保存します
          </p>
        </div>

        <Link
          href={`/admin/drafts/${draft.id}`}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          詳細へ戻る
        </Link>
      </div>

      <form action={updateDraft} className="space-y-6">
        <input type="hidden" name="id" value={draft.id} />

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">基本情報</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-medium">論点:</span>{" "}
                {draft.learningPoint.title}
              </p>
              <p className="mt-2">
                <span className="font-medium">分野:</span>{" "}
                {draft.learningPoint.topic}
                {draft.learningPoint.subtopic
                  ? ` / ${draft.learningPoint.subtopic}`
                  : ""}
              </p>
              <p className="mt-2">
                <span className="font-medium">形式:</span>{" "}
                {draft.learningPoint.questionStyle}
              </p>
              <p className="mt-2">
                <span className="font-medium">難易度:</span>{" "}
                {draft.learningPoint.difficulty}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-medium">画像:</span>{" "}
                {draft.imageAsset ? draft.imageAsset.title : "なし"}
              </p>
              {draft.imageAsset?.findings && (
                <p className="mt-2 leading-6">
                  <span className="font-medium">所見:</span>{" "}
                  {draft.imageAsset.findings}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">問題文と選択肢</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">問題文</label>
              <textarea
                name="stem"
                defaultValue={draft.stem}
                rows={4}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">選択肢 A</label>
              <textarea
                name="choiceA"
                defaultValue={draft.choiceA}
                rows={2}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">選択肢 B</label>
              <textarea
                name="choiceB"
                defaultValue={draft.choiceB}
                rows={2}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">選択肢 C</label>
              <textarea
                name="choiceC"
                defaultValue={draft.choiceC}
                rows={2}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">選択肢 D</label>
              <textarea
                name="choiceD"
                defaultValue={draft.choiceD}
                rows={2}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">正答</label>
              <select
                name="correctAnswer"
                defaultValue={draft.correctAnswer}
                className="rounded-xl border px-4 py-3"
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">解説</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">全体解説</label>
              <textarea
                name="explanation"
                defaultValue={draft.explanation}
                rows={5}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  選択肢Aの解説
                </label>
                <textarea
                  name="explanationA"
                  defaultValue={draft.explanationA ?? ""}
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  選択肢Bの解説
                </label>
                <textarea
                  name="explanationB"
                  defaultValue={draft.explanationB ?? ""}
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  選択肢Cの解説
                </label>
                <textarea
                  name="explanationC"
                  defaultValue={draft.explanationC ?? ""}
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  選択肢Dの解説
                </label>
                <textarea
                  name="explanationD"
                  defaultValue={draft.explanationD ?? ""}
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">レビューコメント</h2>

          <div>
            <textarea
              name="reviewerComment"
              defaultValue={draft.reviewerComment ?? ""}
              rows={4}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm text-blue-700 hover:bg-blue-100"
          >
            保存
          </button>

          <Link
            href={`/admin/drafts/${draft.id}`}
            className="rounded-xl border px-5 py-3 text-sm hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </main>
  );
}
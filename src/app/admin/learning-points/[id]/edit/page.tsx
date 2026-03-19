import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateLearningPoint } from "./actions";

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

export default async function EditLearningPointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const learningPoint = await prisma.learningPoint.findUnique({
    where: { id },
    include: {
      references: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!learningPoint) {
    notFound();
  }

  const referencesText = learningPoint.references.map((r) => r.url).join("\n");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">論点を編集</h1>
          <p className="mt-2 text-sm text-gray-500">
            learning point の内容を修正します
          </p>
        </div>

        <Link
          href={`/admin/learning-points/${learningPoint.id}`}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          詳細へ戻る
        </Link>
      </div>

      <form action={updateLearningPoint} className="space-y-6">
        <input type="hidden" name="id" value={learningPoint.id} />

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">基本情報</h2>

          <div className="mb-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              <span className="font-medium">作成方法:</span>{" "}
              {formatOrigin(learningPoint.origin)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              作成方法はこの画面では変更できません。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">トピック *</label>
              <input
                name="topic"
                defaultValue={learningPoint.topic}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                サブトピック
              </label>
              <input
                name="subtopic"
                defaultValue={learningPoint.subtopic ?? ""}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">タイトル *</label>
              <input
                name="title"
                defaultValue={learningPoint.title}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                learning point 本文 *
              </label>
              <textarea
                name="learningPoint"
                defaultValue={learningPoint.learningPoint}
                rows={5}
                className="w-full rounded-xl border px-4 py-3"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">意図・補足</label>
              <textarea
                name="rationale"
                defaultValue={learningPoint.rationale ?? ""}
                rows={3}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">出題設定</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">難易度 *</label>
              <select
                name="difficulty"
                defaultValue={learningPoint.difficulty}
                className="w-full rounded-xl border px-4 py-3"
                required
              >
                <option value="CORE">必修</option>
                <option value="STANDARD">一般</option>
                <option value="HARD">難問</option>
                <option value="INSANE">超難問</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                タグ（カンマ区切り）
              </label>
              <input
                name="tags"
                defaultValue={learningPoint.tags.join(", ")}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
            
            <div className="md:col-span-2 mt-4">
              <label className="mb-2 block text-sm font-medium">参考資料 (URL)</label>
              <p className="text-xs text-gray-500 mb-2">複数ある場合は改行で区切ってください</p>
              <textarea
                name="references"
                rows={3}
                defaultValue={referencesText}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="https://example.com/guideline1&#10;https://example.com/guideline2"
              />
            </div>
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
            href={`/admin/learning-points/${learningPoint.id}`}
            className="rounded-xl border px-5 py-3 text-sm hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </main>
  );
}
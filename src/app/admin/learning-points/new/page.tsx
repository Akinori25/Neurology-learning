import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createLearningPoint } from "./actions";

export default async function NewLearningPointPage() {
  const [sources, images] = await Promise.all([
    prisma.source.findMany({
      orderBy: { title: "asc" },
    }),
    prisma.imageAsset.findMany({
      where: { status: "ACTIVE" },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">論点を新規追加</h1>
          <p className="mt-2 text-sm text-gray-500">
            問題作成の起点となる learning point を登録します
          </p>
        </div>

        <Link
          href="/admin/learning-points"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          論点一覧へ戻る
        </Link>
      </div>

      <form action={createLearningPoint} className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">基本情報</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">トピック *</label>
              <input
                name="topic"
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: 末梢神経"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                サブトピック
              </label>
              <input
                name="subtopic"
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDP"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">タイトル *</label>
              <input
                name="title"
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDPの髄液所見"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                learning point 本文 *
              </label>
              <textarea
                name="learningPoint"
                rows={5}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDPでは典型的に髄液蛋白上昇を認めるが、著明な細胞数増多は通常伴わない。"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">意図・補足</label>
              <textarea
                name="rationale"
                rows={3}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDP診断の基本所見であり、知識問題にも症例問題にも展開しやすい。"
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
                defaultValue="STANDARD"
                className="w-full rounded-xl border px-4 py-3"
                required
              >
                <option value="CORE">必修</option>
                <option value="STANDARD">一般</option>
                <option value="HARD">難問</option>
                <option value="INSANE">超難問</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">問題形式 *</label>
              <select
                name="questionStyle"
                defaultValue="FACT"
                className="w-full rounded-xl border px-4 py-3"
                required
              >
                <option value="FACT">知識</option>
                <option value="CASE">症例</option>
                <option value="DIFFERENTIAL">鑑別</option>
                <option value="TREATMENT">治療</option>
                <option value="IMAGE">画像</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                タグ（カンマ区切り）
              </label>
              <input
                name="tags"
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDP, 髄液, 蛋白細胞解離"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">資料・画像</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">参照資料</label>
              <select
                name="sourceId"
                className="w-full rounded-xl border px-4 py-3"
                defaultValue=""
              >
                <option value="">未選択</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">候補画像</label>
              <select
                name="imageAssetId"
                className="w-full rounded-xl border px-4 py-3"
                defaultValue=""
              >
                <option value="">未選択</option>
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm text-blue-700 hover:bg-blue-100"
          >
            論点を作成
          </button>

          <Link
            href="/admin/learning-points"
            className="rounded-xl border px-5 py-3 text-sm hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </main>
  );
}
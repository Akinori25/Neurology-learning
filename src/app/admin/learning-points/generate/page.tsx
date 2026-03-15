import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateLearningPointCandidatesAction } from "./actions";
import LearningPointCandidatesForm from "./LearningPointCandidatesForm";

export function formatDifficulty(value: string) {
  switch (value) {
    case "CORE":
      return "必修";
    case "STANDARD":
      return "一般";
    case "HARD":
      return "難問";
    case "INSANE":
      return "超難問";
    default:
      return value;
  }
}

export function formatQuestionStyle(value: string) {
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

export default async function GenerateLearningPointsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const sources = await prisma.source.findMany({
    orderBy: { title: "asc" },
  });

  const topic =
    typeof resolvedSearchParams.topic === "string"
      ? resolvedSearchParams.topic
      : "";
  const subtopic =
    typeof resolvedSearchParams.subtopic === "string"
      ? resolvedSearchParams.subtopic
      : "";
  const sourceId =
    typeof resolvedSearchParams.sourceId === "string"
      ? resolvedSearchParams.sourceId
      : "";
  const keywords =
    typeof resolvedSearchParams.keywords === "string"
      ? resolvedSearchParams.keywords
      : "";
  const count =
    typeof resolvedSearchParams.count === "string"
      ? resolvedSearchParams.count
      : "5";
  const targetDifficulty =
    typeof resolvedSearchParams.targetDifficulty === "string"
      ? resolvedSearchParams.targetDifficulty
      : "";

  let result:
    | Awaited<ReturnType<typeof generateLearningPointCandidatesAction>>
    | null = null;

  if (topic) {
    const formData = new FormData();
    formData.set("topic", topic);
    formData.set("subtopic", subtopic);
    formData.set("sourceId", sourceId);
    formData.set("keywords", keywords);
    formData.set("count", count);
    formData.set("targetDifficulty", targetDifficulty);

    try {
      result = await generateLearningPointCandidatesAction(formData);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">LLMで論点候補生成</h1>
          <p className="mt-2 text-sm text-gray-500">
            topic や資料をもとに learning point 候補を生成します
          </p>
        </div>

        <Link
          href="/admin/learning-points"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          論点一覧へ戻る
        </Link>
      </div>

      <form method="GET" className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">生成条件</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">トピック *</label>
              <input
                name="topic"
                defaultValue={topic}
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
                defaultValue={subtopic}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: CIDP"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">資料</label>
              <select
                name="sourceId"
                defaultValue={sourceId}
                className="w-full rounded-xl border px-4 py-3"
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
              <label className="mb-2 block text-sm font-medium">希望難易度</label>
              <select
                name="targetDifficulty"
                defaultValue={targetDifficulty}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="">指定しない</option>
                <option value="CORE">必修</option>
                <option value="STANDARD">一般</option>
                <option value="HARD">難問</option>
                <option value="INSANE">超難問</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">生成件数</label>
              <select
                name="count"
                defaultValue={count}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="3">3件</option>
                <option value="5">5件</option>
                <option value="8">8件</option>
                <option value="10">10件</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                補助キーワード
              </label>
              <input
                name="keywords"
                defaultValue={keywords}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="例: 髄液, 伝導ブロック, MRI, 診断"
              />
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm text-blue-700 hover:bg-blue-100"
            >
              候補を生成
            </button>
          </div>
        </section>
      </form>

      {result && (
        <LearningPointCandidatesForm
          topic={result.topic}
          subtopic={result.subtopic}
          sourceId={result.sourceId ?? ""}
          candidates={result.candidates}
        />
      )}
    </main>
  );
}
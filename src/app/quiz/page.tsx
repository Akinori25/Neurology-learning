import { Prisma, Difficulty } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import QuizRunner from "@/components/QuizRunner";
import Link from "next/link";

type QuizPageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
    mode?: string;
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

function difficultyLabel(difficulty: Difficulty) {
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

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = (await searchParams) ?? {};
  const selectedTopic = params.topic?.trim() || "";
  const selectedDifficulty = isDifficulty(params.difficulty)
    ? params.difficulty
    : "";
  const mode = params.mode === "random" ? "random" : "latest";

  const where: Prisma.ExamQuestionWhereInput = {
    publishStatus: "ACTIVE",
    ...(selectedTopic || selectedDifficulty
      ? {
          draft: {
            learningPoint: {
              ...(selectedTopic ? { topic: selectedTopic } : {}),
              ...(selectedDifficulty ? { difficulty: selectedDifficulty } : {}),
            },
          },
        }
      : {}),
  };

  const topicsRaw = await prisma.learningPoint.findMany({
    select: { topic: true },
    distinct: ["topic"],
    orderBy: { topic: "asc" },
  });

  const topics = topicsRaw.map((t) => t.topic);

  const questions =
    mode === "random"
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT eq.id
          FROM "ExamQuestion" eq
          JOIN "QuestionDraft" qd ON eq."draftId" = qd.id
          JOIN "LearningPoint" lp ON qd."learningPointId" = lp.id
          WHERE eq."publishStatus" = 'ACTIVE'
            ${selectedTopic
              ? Prisma.sql`AND lp."topic" = ${selectedTopic}`
              : Prisma.empty}
            ${selectedDifficulty
              ? Prisma.sql`AND lp."difficulty" = CAST(${selectedDifficulty} AS "Difficulty")`
              : Prisma.empty}
          ORDER BY RANDOM()
          LIMIT 10
        `.then(async (rows) => {
          const ids = rows.map((r) => r.id);
          if (ids.length === 0) return [];

          const fetched = await prisma.examQuestion.findMany({
            where: { id: { in: ids } },
            include: {
              draft: {
                include: {
                  imageAsset: true,
                  learningPoint: true,
                },
              },
            },
          });

          const orderMap = new Map(ids.map((id, index) => [id, index]));
          return fetched.sort(
            (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
          );
        })
      : await prisma.examQuestion.findMany({
          where,
          include: {
            draft: {
              include: {
                imageAsset: true,
                learningPoint: true,
              },
            },
          },
          orderBy: {
            publishedAt: "desc",
          },
          take: 10,
        });

  const formattedQuestions = questions.map((q) => ({
    id: q.id,
    stem: q.draft.stem,
    choiceA: q.draft.choiceA,
    choiceB: q.draft.choiceB,
    choiceC: q.draft.choiceC,
    choiceD: q.draft.choiceD,
    correctAnswer: q.draft.correctAnswer,
    explanation: q.draft.explanation,
    imageAsset: q.draft.imageAsset
      ? {
          fileUrl: q.draft.imageAsset.fileUrl,
          title: q.draft.imageAsset.title,
        }
      : null,
    learningPoint: q.draft.learningPoint
      ? {
          topic: q.draft.learningPoint.topic,
          subtopic: q.draft.learningPoint.subtopic,
          difficulty: q.draft.learningPoint.difficulty,
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="mb-2 text-sm font-medium text-sky-700">Neurology Quiz</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            演習
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            topic・difficultyで絞り込みながら、専門医試験向けの演習を行います。
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Topic
              </label>
              <select
                name="topic"
                defaultValue={selectedTopic}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Difficulty
              </label>
              <select
                name="difficulty"
                defaultValue={selectedDifficulty}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">すべて</option>
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                出題順
              </label>
              <select
                name="mode"
                defaultValue={mode}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="latest">新しい順</option>
                <option value="random">ランダム</option>
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
                href="/quiz"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </section>

        {formattedQuestions.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-medium text-slate-900">
              条件に一致する問題がありません
            </p>
            <p className="mt-2 text-sm text-slate-500">
              topic または difficulty を変更して再度お試しください。
            </p>
          </section>
        ) : (
          <QuizRunner questions={formattedQuestions} />
        )}
      </div>
    </main>
  );
}
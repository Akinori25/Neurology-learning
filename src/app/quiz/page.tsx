import { Prisma, Difficulty } from "@prisma/client";
import { unstable_cache } from "next/cache";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import QuizRunner from "@/components/QuizRunner";

export const dynamic = "force-dynamic";

type QuizPageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
    mode?: string;
    index?: string;
    ids?: string;
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

function buildQuizHref({
  topic,
  difficulty,
  mode,
  index,
  ids,
}: {
  topic?: string;
  difficulty?: string;
  mode?: string;
  index?: number;
  ids?: string[];
}) {
  const sp = new URLSearchParams();

  if (topic) sp.set("topic", topic);
  if (difficulty) sp.set("difficulty", difficulty);
  if (mode) sp.set("mode", mode);
  if (typeof index === "number") sp.set("index", String(index));
  if (ids && ids.length > 0) sp.set("ids", ids.join(","));

  const qs = sp.toString();
  return qs ? `/quiz?${qs}` : "/quiz";
}

const questionSelect = {
  id: true,
  stem: true,
  choiceA: true,
  choiceB: true,
  choiceC: true,
  choiceD: true,
  correctAnswer: true,
  explanation: true,
  imageAsset: {
    select: {
      fileUrl: true,
      id: true,
    },
  },
  learningPoint: {
    select: {
      topic: true,
      subtopic: true,
      difficulty: true,
      origin: true,
      references: {
        select: {
          id: true,
          url: true,
          orderIndex: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  },
} satisfies Prisma.QuestionDraftSelect;

type SelectedQuestion = Prisma.QuestionDraftGetPayload<{
  select: typeof questionSelect;
}>;

const getCachedTopics = unstable_cache(
  async () => {
    const topicsRaw = await prisma.learningPoint.findMany({
      where: {
        topic: {
          not: "",
        },
      },
      select: { topic: true },
      distinct: ["topic"],
      orderBy: { topic: "asc" },
    });

    return topicsRaw.map((t) => t.topic);
  },
  ["quiz-topics"],
  {
    revalidate: 60 * 10,
  }
);

function formatQuestion(question: SelectedQuestion | null) {
  if (!question) return null;

  return {
    id: question.id,
    stem: question.stem,
    choiceA: question.choiceA,
    choiceB: question.choiceB,
    choiceC: question.choiceC,
    choiceD: question.choiceD,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    imageAsset: question.imageAsset
      ? {
          fileUrl: question.imageAsset.fileUrl,
          id: question.imageAsset.id,
        }
      : null,
    learningPoint: question.learningPoint
      ? {
          topic: question.learningPoint.topic,
          subtopic: question.learningPoint.subtopic,
          difficulty: question.learningPoint.difficulty,
        }
      : null,
    isGood: false,
    raiseHands: [],
  };
}

function QuizHeader() {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="mb-2 text-sm font-medium text-sky-700">Neurology Quiz</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          演習
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          topic・difficultyで絞り込みながら、専門医試験向けの演習を行います。
        </p>
      </div>

      <div className="shrink-0">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Homeへ戻る
        </Link>
      </div>
    </header>
  );
}

function QuizFilters({
  topics,
  selectedTopic,
  selectedDifficulty,
  mode,
}: {
  topics: string[];
  selectedTopic: string;
  selectedDifficulty: string;
  mode: "latest" | "random";
}) {
  return (
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
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p className="text-base font-medium text-slate-900">
        条件に一致する問題がありません
      </p>
      <p className="mt-2 text-sm text-slate-500">
        topic または difficulty を変更して再度お試しください。
      </p>
    </section>
  );
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = (await searchParams) ?? {};

  const selectedTopic = params.topic?.trim() || "";
  const selectedDifficulty = isDifficulty(params.difficulty)
    ? params.difficulty
    : "";
  const mode: "latest" | "random" =
    params.mode === "random" ? "random" : "latest";

  const parsedIndex = Number(params.index ?? "0");
  const currentIndex =
    Number.isFinite(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0;

  const where: Prisma.QuestionDraftWhereInput = {
    isPublished: true,
    ...(selectedTopic || selectedDifficulty
      ? {
          learningPoint: {
            ...(selectedTopic ? { topic: selectedTopic } : {}),
            ...(selectedDifficulty ? { difficulty: selectedDifficulty } : {}),
          },
        }
      : {}),
  };

  const topics = await getCachedTopics();

  let question: SelectedQuestion | null = null;
  let total = 0;
  let safeIndex = 0;
  let prevHref: string | null = null;
  let nextHref: string | null = null;

  if (mode === "random") {
    let idsForRandom =
      params.ids?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

    if (idsForRandom.length === 0) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT qd.id
        FROM "QuestionDraft" qd
        JOIN "LearningPoint" lp ON qd."learningPointId" = lp.id
        WHERE qd."isPublished" = true
          ${selectedTopic
            ? Prisma.sql`AND lp."topic" = ${selectedTopic}`
            : Prisma.empty}
          ${selectedDifficulty
            ? Prisma.sql`AND lp."difficulty" = CAST(${selectedDifficulty} AS "Difficulty")`
            : Prisma.empty}
        ORDER BY RANDOM()
        LIMIT 10
      `;
      idsForRandom = rows.map((r) => r.id);
    }

    total = idsForRandom.length;
    safeIndex = total === 0 ? 0 : Math.min(Math.max(currentIndex, 0), total - 1);

    const currentId = idsForRandom[safeIndex];

    if (currentId) {
      question = await prisma.questionDraft.findFirst({
        where: {
          id: currentId,
          isPublished: true,
        },
        select: questionSelect,
      });
    }

    prevHref =
      safeIndex > 0
        ? buildQuizHref({
            topic: selectedTopic,
            difficulty: selectedDifficulty,
            mode,
            index: safeIndex - 1,
            ids: idsForRandom,
          })
        : null;

    nextHref =
      safeIndex < total - 1
        ? buildQuizHref({
            topic: selectedTopic,
            difficulty: selectedDifficulty,
            mode,
            index: safeIndex + 1,
            ids: idsForRandom,
          })
        : null;
  } else {
    total = await prisma.questionDraft.count({ where });
    safeIndex = total === 0 ? 0 : Math.min(Math.max(currentIndex, 0), total - 1);

    const rows = await prisma.questionDraft.findMany({
      where,
      select: questionSelect,
      orderBy: {
        publishedAt: "desc",
      },
      skip: safeIndex,
      take: 1,
    });

    question = rows[0] ?? null;

    prevHref =
      safeIndex > 0
        ? buildQuizHref({
            topic: selectedTopic,
            difficulty: selectedDifficulty,
            mode,
            index: safeIndex - 1,
          })
        : null;

    nextHref =
      safeIndex < total - 1
        ? buildQuizHref({
            topic: selectedTopic,
            difficulty: selectedDifficulty,
            mode,
            index: safeIndex + 1,
          })
        : null;
  }

  const formattedQuestion = formatQuestion(question);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <QuizHeader />
        <QuizFilters
          topics={topics}
          selectedTopic={selectedTopic}
          selectedDifficulty={selectedDifficulty}
          mode={mode}
        />

        {!formattedQuestion ? (
          <EmptyState />
        ) : (
          <QuizRunner
            question={formattedQuestion}
            currentIndex={safeIndex}
            total={total}
            prevHref={prevHref}
            nextHref={nextHref}
          />
        )}
      </div>
    </main>
  );
}
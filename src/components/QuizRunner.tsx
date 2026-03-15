"use client";

import Link from "next/link";
import QuizCard from "@/components/QuizCard";

type QuizQuestion = {
  id: string;
  stem: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctAnswer: string;
  explanation: string;
  imageAsset?: {
    fileUrl: string;
    title: string;
  } | null;
  learningPoint?: {
    topic: string;
    subtopic: string | null;
    difficulty?: string;
  } | null;
  isGood?: boolean;
  raiseHands?: {
    id: string;
    comment: string;
    createdAt?: string;
  }[];
};

type QuizRunnerProps = {
  question: QuizQuestion;
  currentIndex: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
};

export default function QuizRunner({
  question,
  currentIndex,
  total,
  prevHref,
  nextHref,
}: QuizRunnerProps) {
  const progressPercent = total === 0 ? 0 : ((currentIndex + 1) / total) * 100;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-700">
            問題 {currentIndex + 1} / {total}
          </div>
          <div className="text-sm text-slate-500">
            {Math.round(progressPercent)}%
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <QuizCard question={question} index={currentIndex} total={total} />

      <div className="sticky bottom-3 z-10">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {prevHref ? (
              <Link
                href={prevHref}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                前の問題
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
                前の問題
              </span>
            )}

            <p className="text-center text-sm text-slate-500">
              {currentIndex + 1} / {total}
            </p>

            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                次の問題
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-300 px-4 text-sm font-medium text-white">
                次の問題
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
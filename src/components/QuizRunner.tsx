"use client";

import { useMemo, useState } from "react";
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
};

type QuizRunnerProps = {
  questions: QuizQuestion[];
};

export default function QuizRunner({ questions }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];

  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  if (questions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-medium text-slate-900">
          公開中の問題がありません。
        </p>
        <p className="mt-2 text-sm text-slate-500">
          条件を変更するか、問題の公開状態をご確認ください。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-700">
            問題 {currentIndex + 1} / {questions.length}
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

      <QuizCard
        question={currentQuestion}
        index={currentIndex}
        total={questions.length}
      />

      <div className="sticky bottom-3 z-10">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              前の問題
            </button>

            <p className="text-center text-sm text-slate-500">
              {currentIndex + 1} / {questions.length}
            </p>

            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次の問題
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
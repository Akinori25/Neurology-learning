"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { saveRaiseHand, toggleDraftGood } from "@/app/quiz/actions";

type QuizCardProps = {
  question: {
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
      id: string;
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
  index: number;
  total: number;
};

function difficultyClass(difficulty?: string) {
  switch (difficulty) {
    case "CORE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "STANDARD":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "HARD":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "INSANE":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default function QuizCard({ question, index, total }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);

  const [isGood, setIsGood] = useState<boolean>(question.isGood ?? false);
  const [showRaiseHandBox, setShowRaiseHandBox] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [savedComments, setSavedComments] = useState<
    { id: string; comment: string; createdAt?: string }[]
  >(question.raiseHands ?? []);

  const [isMetaPending, startMetaTransition] = useTransition();

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setFeedback(null);

    setIsGood(question.isGood ?? false);
    setShowRaiseHandBox(false);
    setCommentInput("");
    setSavedComments(question.raiseHands ?? []);
  }, [question.id, question.isGood, question.raiseHands]);

  const choices = useMemo(
    () => [
      { key: "A", text: question.choiceA },
      { key: "B", text: question.choiceB },
      { key: "C", text: question.choiceC },
      { key: "D", text: question.choiceD },
    ],
    [question.choiceA, question.choiceB, question.choiceC, question.choiceD]
  );

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelected(key);
  };

  const handleRevealAnswer = () => {
    if (!selected || revealed) return;

    const isCorrect = selected === question.correctAnswer;

    setFeedback({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
    setRevealed(true);
  };

  const handleToggleGood = () => {
    if (isMetaPending) return;

    const optimistic = !isGood;
    setIsGood(optimistic);

    startMetaTransition(async () => {
      try {
        const result = await toggleDraftGood({
          questionDraftId: question.id,
        });
        setIsGood(result.isGood);
      } catch (error) {
        console.error(error);
        setIsGood(!optimistic);
        alert("good の保存に失敗しました。");
      }
    });
  };

  const handleRaiseHandConfirm = () => {
    if (isMetaPending) return;

    const trimmed = commentInput.trim();

    if (!trimmed) {
      setShowRaiseHandBox(false);
      setCommentInput("");
      return;
    }

    startMetaTransition(async () => {
      try {
        const result = await saveRaiseHand({
          questionDraftId: question.id,
          comment: trimmed,
        });

        setSavedComments((prev) => [
          {
            id: result.id,
            comment: result.comment,
            createdAt: result.createdAt,
          },
          ...prev,
        ]);

        setShowRaiseHandBox(false);
        setCommentInput("");
      } catch (error) {
        console.error(error);
        alert("コメントの保存に失敗しました。");
      }
    });
  };

  const correctAnswer = feedback?.correctAnswer ?? question.correctAnswer;

  const getButtonClass = (key: string) => {
    const base =
      "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-150 disabled:cursor-not-allowed sm:px-5 sm:py-4";

    if (!revealed) {
      if (selected === key) {
        return `${base} border-sky-400 bg-sky-50 shadow-sm`;
      }
      return `${base} border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50`;
    }

    if (key === correctAnswer) {
      return `${base} border-emerald-300 bg-emerald-50 shadow-sm`;
    }

    if (key === selected && key !== correctAnswer) {
      return `${base} border-rose-300 bg-rose-50 shadow-sm`;
    }

    return `${base} border-slate-200 bg-slate-50 text-slate-500`;
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              問題 {index + 1} / {total}
            </span>

            {question.learningPoint?.topic && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {question.learningPoint.topic}
              </span>
            )}

            {question.learningPoint?.subtopic && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
                {question.learningPoint.subtopic}
              </span>
            )}

            {question.learningPoint?.difficulty && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${difficultyClass(
                  question.learningPoint.difficulty
                )}`}
              >
                {question.learningPoint.difficulty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            <button
              type="button"
              onClick={handleToggleGood}
              disabled={isMetaPending}
              className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                isGood
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              👍 Good
            </button>

            <button
              type="button"
              onClick={() => {
                if (isMetaPending) return;
                setShowRaiseHandBox((prev) => !prev);
              }}
              disabled={isMetaPending}
              className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                showRaiseHandBox
                  ? "border-sky-300 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              ✋ 挙手
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <h2 className="text-xl font-bold leading-8 tracking-tight text-slate-900 sm:text-3xl sm:leading-10">
          {question.stem}
        </h2>

        {question.imageAsset && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img
              src={question.imageAsset.fileUrl}
              alt="画像"
              className="h-auto max-h-[28rem] w-full object-contain"
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              onClick={() => handleSelect(choice.key)}
              disabled={revealed}
              className={getButtonClass(choice.key)}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {choice.key}
                </span>
                <span className="pt-1 text-sm leading-6 text-slate-800 sm:text-base">
                  {choice.text}
                </span>
              </div>
            </button>
          ))}
        </div>

        {!revealed && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleRevealAnswer}
              disabled={!selected}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              答え合わせ
            </button>
          </div>
        )}

        {showRaiseHandBox && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
            <p className="mb-2 text-sm font-semibold text-slate-900">
              コメントを入力してください
            </p>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={4}
              placeholder="この問題について気になった点、修正案、質問など"
              className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRaiseHandConfirm}
                disabled={isMetaPending}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isMetaPending) return;
                  setShowRaiseHandBox(false);
                  setCommentInput("");
                }}
                disabled={isMetaPending}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                cancel
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              空欄のまま confirm すると、挙手は取り消されます。
            </p>
          </div>
        )}

        {revealed && feedback && (
          <div
            className={`mt-6 rounded-2xl border p-4 sm:p-5 ${
              feedback.isCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  feedback.isCorrect
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {feedback.isCorrect ? "正解" : "不正解"}
              </span>

              <span className="text-sm text-slate-700">
                正答: {feedback.correctAnswer}
              </span>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-sm font-semibold text-slate-900">解説</p>
              <p className="text-sm leading-7 text-slate-700 sm:text-[15px] whitespace-pre-line">
                {feedback.explanation}
              </p>
            </div>

            {savedComments.length > 0 && (
              <div className="mt-4 border-t border-black/10 pt-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">
                  以前のコメント
                </p>
                <div className="space-y-2">
                  {savedComments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2"
                    >
                      <p className="text-sm leading-6 text-slate-700 whitespace-pre-line">
                        {item.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
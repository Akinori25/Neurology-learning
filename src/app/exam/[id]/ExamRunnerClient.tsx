"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { submitExamAttempt } from "../actions";

type UIProps = {
  exam: any;
  items: any[];
};

type AnswerRecord = {
  item: any;
  selectedKey: string | null;
  isCorrect: boolean;
};

export default function ExamRunnerClient({ exam, items }: UIProps) {
  const timeLimit = Number(exam.secondsPerQuestion ?? 10);
  
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Stats
  const [devScore, setDevScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  const currentItem = items[currentIndex];

  const currentChoices = useMemo(() => {
    if (!currentItem) return [];
    const arr = [
      { key: "A", text: currentItem.draft.choiceA },
      { key: "B", text: currentItem.draft.choiceB },
      { key: "C", text: currentItem.draft.choiceC },
      { key: "D", text: currentItem.draft.choiceD },
    ];
    let hash = 0;
    const str = currentItem.draft.id;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    const rand = () => {
        hash = Math.imul(hash, 1664525) + 1013904223 | 0;
        return (hash >>> 0) / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [currentItem]);

  const handleNext = async (autoChoice: string | null = null) => {
    const finalChoice = autoChoice !== null ? autoChoice : selected;
    const isCorrect = finalChoice === currentItem.draft.correctAnswer;
    
    const newAnswers = [...answers, {
      item: currentItem,
      selectedKey: finalChoice,
      isCorrect,
    }];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= items.length) {
      await finishExam(newAnswers);
    } else {
      setSelected(null);
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(timeLimit);
    }
  };

  useEffect(() => {
    if (!started || isFinished) return;

    if (timeLeft <= 0) {
      handleNext(null); // Time out = empty choice
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, started, isFinished, currentIndex]);

  const finishExam = async (finalAnswers: AnswerRecord[]) => {
    setIsFinished(true);
    setSaving(true);
    
    const score = finalAnswers.filter(a => a.isCorrect).length;
    let deviation: number | null = null;
    let isPassed: boolean | null = null;

    if (exam.predictedMeanScore != null && exam.predictedStdDev != null && exam.predictedStdDev > 0) {
      deviation = 50 + 10 * (score - exam.predictedMeanScore) / exam.predictedStdDev;
      if (exam.passDeviationThreshold != null) {
        isPassed = deviation >= exam.passDeviationThreshold;
      }
    }

    setDevScore(deviation);
    setPassed(isPassed);

    try {
      await submitExamAttempt({
        examId: exam.id,
        score,
        totalQuestions: items.length,
        deviation,
        passed: isPassed,
      });
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getDisplayLabel = (choicesArr: any[], key: string) => {
    const index = choicesArr.findIndex((c) => c.key === key);
    if (index === -1) return key;
    return ["A", "B", "C", "D"][index];
  };

  if (!started) {
    return (
      <main className="mx-auto max-w-2xl p-6 mt-12 text-center">
        <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
        <p className="mb-8 text-slate-600">
          全 {items.length} 問の模擬試験です。<br />
          各問題の制限時間は <strong>{timeLimit}秒</strong> で、自動的に次の問題へ遷移します。<br />
          <span className="text-rose-500 font-semibold text-sm">※戻ることはできません。時間切れは不正解になります。</span>
        </p>
        <button
          onClick={() => setStarted(true)}
          className="rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-800 shadow-xl"
        >
          試験を開始する
        </button>
      </main>
    );
  }

  if (isFinished) {
    const score = answers.filter(a => a.isCorrect).length;
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-8 text-center bg-slate-900 text-white rounded-3xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-6">試験結果</h1>
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-sm opacity-80 uppercase tracking-widest text-emerald-300">Score</p>
              <p className="text-5xl font-black">{score}<span className="text-2xl opacity-60">/{items.length}</span></p>
            </div>
            {devScore != null && (
              <div className="border-l border-white/20 pl-8">
                <p className="text-sm opacity-80 uppercase tracking-widest text-sky-300">Deviation</p>
                <p className="text-5xl font-black">{devScore.toFixed(1)}</p>
              </div>
            )}
          </div>
          {passed != null && (
            <div className={`inline-block px-6 py-2 rounded-full text-lg font-bold tracking-wider ${passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {passed ? "合格判定" : "不合格判定"}
            </div>
          )}
          {saving && <p className="text-xs opacity-50 mt-4">成績を保存中...</p>}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">解答明細</h2>
          <Link href="/exam" className="rounded-xl border px-4 py-2 hover:bg-gray-50 text-sm font-medium">試験一覧へ戻る</Link>
        </div>

        <div className="space-y-8">
          {answers.map((ans, idx) => {
            const draft = ans.item.draft;
            const lp = draft.learningPoint;
            
            // Recalculate deterministic choices array identical to when it was shown
            const historicalChoices = (() => {
                const arr = [
                    { key: "A", text: draft.choiceA },
                    { key: "B", text: draft.choiceB },
                    { key: "C", text: draft.choiceC },
                    { key: "D", text: draft.choiceD },
                ];
                let h = 0;
                for (let i = 0; i < draft.id.length; i++) h = Math.imul(31, h) + draft.id.charCodeAt(i) | 0;
                const r = () => { h = Math.imul(h, 1664525) + 1013904223 | 0; return (h >>> 0) / 4294967296; };
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(r() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            })();

            const labelSelected = ans.selectedKey ? getDisplayLabel(historicalChoices, ans.selectedKey) : "未選択";
            const labelCorrect = getDisplayLabel(historicalChoices, draft.correctAnswer);

            return (
              <div key={draft.id} className="rounded-2xl border bg-white p-6 shadow-sm relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${ans.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-bold text-slate-800">Q{idx + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${ans.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {ans.isCorrect ? "正解" : "不正解"}
                  </span>
                  <span className="text-sm text-slate-500 ml-auto">
                     あなたの回答: <strong className={ans.isCorrect ? "text-emerald-600" : "text-rose-600"}>{labelSelected}</strong> / 正答: <strong>{labelCorrect}</strong>
                  </span>
                </div>
                
                <h3 className="font-medium text-lg mb-4">{draft.stem}</h3>
                
                {draft.imageAsset && (
                  <div className="mb-4">
                    <img src={draft.imageAsset.fileUrl} alt="問題画像" className="max-h-64 object-contain rounded-lg border" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {historicalChoices.map((c, i) => {
                    const dl = ["A", "B", "C", "D"][i];
                    const isCorrectChoice = c.key === draft.correctAnswer;
                    const isSelectedChoice = c.key === ans.selectedKey;
                    
                    let cls = "border p-3 rounded-xl flex gap-3 items-start ";
                    if (isCorrectChoice) cls += "border-emerald-300 bg-emerald-50";
                    else if (isSelectedChoice) cls += "border-rose-300 bg-rose-50";
                    else cls += "border-slate-100 bg-slate-50 opacity-60";

                    return (
                      <div key={c.key} className={cls}>
                        <span className="shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold border">{dl}</span>
                        <span className="text-sm pt-0.5">{c.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
                  <h4 className="text-sm font-bold text-sky-900 mb-2">解説</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{draft.explanation}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                   <span className="bg-slate-100 px-2 py-1 rounded">Topic: {lp.topic}{lp.subtopic && ` > ${lp.subtopic}`}</span>
                   <span className="bg-slate-100 px-2 py-1 rounded">Origin: {lp.origin}</span>
                </div>

                {lp.references && lp.references.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border text-sm">
                    <h4 className="font-bold text-slate-800 mb-2">参考資料</h4>
                    <ul className="list-disc list-inside space-y-1 text-sky-600">
                      {lp.references.map((ref: any, idx: number) => (
                        <li key={ref.id} className="truncate">
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {ref.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 min-h-screen flex flex-col pt-12">
      <div className="mb-6 flex items-center justify-between">
         <span className="font-bold text-slate-500 tracking-widest text-sm uppercase">Question {currentIndex + 1} of {items.length}</span>
         <span className={`font-mono text-2xl font-bold ${timeLeft <= 3 ? "text-rose-500" : "text-emerald-500"}`}>
           00:{timeLeft.toString().padStart(2, "0")}
         </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-emerald-500 h-full transition-all duration-1000 ease-linear" 
          style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
        />
      </div>

      <div className="flex-1">
        <h2 className="text-xl sm:text-2xl font-bold mb-8 leading-relaxed">
          {currentItem.draft.stem}
        </h2>

        {currentItem.draft.imageAsset && (
            <div className="mb-8 flex justify-center">
            <img src={currentItem.draft.imageAsset.fileUrl} alt="問題画像" className="max-h-80 object-contain rounded-2xl border shadow-sm" />
            </div>
        )}

        <div className="space-y-4">
          {currentChoices.map((choice, idx) => {
            const dl = ["A", "B", "C", "D"][idx];
            return (
              <button
                key={choice.key}
                onClick={() => setSelected(choice.key)}
                className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-2xl border text-left transition-all ${
                  selected === choice.key 
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selected === choice.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {dl}
                </div>
                <div className="pt-1 font-medium text-slate-800">
                  {choice.text}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-12 flex justify-end">
        <button
          onClick={() => handleNext()}
          className="rounded-xl bg-slate-900 px-8 py-4 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {currentIndex + 1 === items.length ? "終了する" : "次の問題へ"}
        </button>
      </div>
    </main>
  );
}

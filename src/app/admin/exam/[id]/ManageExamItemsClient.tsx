"use client";

import { useState, useTransition } from "react";
import { searchPublishedDrafts } from "../../question-sets/[id]/actions";
import { addDraftToExam, removeDraftFromExam, togglePublishExam, calculateExamStats, updateExamMetadata } from "./actions";

type UIProps = {
  exam: any;
  items: any[];
};

export default function ManageExamItemsClient({ exam, items }: UIProps) {
  const [isPending, startTransition] = useTransition();
  const [topicFilter, setTopicFilter] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    const results = await searchPublishedDrafts(topicFilter);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAutoEstimate = () => {
    if (!confirm("現在の収録問題から推定平均点と標準偏差を計算し、上書き保存しますか？")) return;
    startTransition(() => {
        calculateExamStats(exam.id).catch(console.error);
    });
  };

  const existingDraftIds = new Set(items.map((i) => i.draft.id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">構成問題 (順序固定)</h2>
            <button
              onClick={() => startTransition(() => togglePublishExam(exam.id, !exam.isPublished))}
              disabled={isPending}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                exam.isPublished 
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {exam.isPublished ? "非公開にする" : "公開する"}
            </button>
          </div>
          
          <div className="space-y-3 mt-4">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex justify-between items-start gap-3">
                  <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.draft.stem}</p>
                    <div className="flex gap-2 items-center mt-2">
                       <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                         {item.draft.learningPoint.difficulty}
                       </span>
                    </div>
                  </div>
                  <button
                    onClick={() => startTransition(() => removeDraftFromExam(exam.id, item.draft.id))}
                    disabled={isPending}
                    className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-xs"
                  >
                    外す
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-500">問題がありません。</p>}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">成績予測設定</h2>
            <button
              onClick={handleAutoEstimate}
              disabled={isPending || items.length === 0}
              className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
            >
              自動推定を実行
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">自動推定後、必要な場合は手動補正を行ってください。</p>

          <form action={(formData) => startTransition(() => updateExamMetadata(exam.id, formData))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">予想平均点</label>
                <input
                  name="predictedMeanScore"
                  type="number"
                  step="0.1"
                  defaultValue={exam.predictedMeanScore ?? ""}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">標準偏差</label>
                <input
                  name="predictedStdDev"
                  type="number"
                  step="0.1"
                  defaultValue={exam.predictedStdDev ?? ""}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">合格偏差値ライン</label>
              <input
                name="passDeviationThreshold"
                type="number"
                step="0.1"
                defaultValue={exam.passDeviationThreshold ?? 50}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm text-white font-medium hover:bg-slate-800"
            >
              設定を保存
            </button>
          </form>
        </section>
      </div>

      <section className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">問題を追加</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Topicで絞り込み (必須)"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !topicFilter.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              検索
            </button>
          </div>

          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
            {searchResults.map((draft) => {
              const isAdded = existingDraftIds.has(draft.id);
              return (
                <div key={draft.id} className={`rounded-xl border p-4 ${isAdded ? 'bg-slate-50 opacity-60' : ''}`}>
                  <p className="text-sm font-medium line-clamp-2">{draft.stem}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    {draft.learningPoint.topic} {draft.learningPoint.subtopic && `> ${draft.learningPoint.subtopic}`}
                  </p>
                  <button
                    onClick={() => startTransition(() => addDraftToExam(exam.id, draft.id))}
                    disabled={isPending || isAdded}
                    className={`text-xs px-3 py-1.5 rounded-lg ${
                      isAdded ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {isAdded ? "追加済み" : "模試に追加"}
                  </button>
                </div>
              );
            })}
            {!isSearching && searchResults.length === 0 && topicFilter && (
              <p className="text-sm text-slate-500 text-center py-4">該当する問題が見つかりません</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

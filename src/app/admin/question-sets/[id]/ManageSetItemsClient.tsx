"use client";

import { useState, useTransition } from "react";
import { searchPublishedDrafts, addDraftToSet, removeDraftFromSet, togglePublishSet } from "./actions";

type Item = {
  id: string;
  orderIndex: number;
  draft: {
    id: string;
    stem: string;
    learningPoint: {
      topic: string;
      subtopic: string | null;
    };
  };
};

export default function ManageSetItemsClient({
  setId,
  items,
  isPublished,
}: {
  setId: string;
  items: Item[];
  isPublished: boolean;
}) {
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

  const existingDraftIds = new Set(items.map((i) => i.draft.id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Set Details & Current Items */}
      <section className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">設定一覧</h2>
            <button
              onClick={() => startTransition(() => togglePublishSet(setId, !isPublished))}
              disabled={isPending}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isPublished 
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {isPublished ? "非公開にする" : "公開する"}
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">合計 {items.length} 問</p>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flexjustify-between items-start gap-3">
                  <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.draft.stem}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.draft.learningPoint.topic} {item.draft.learningPoint.subtopic && `> ${item.draft.learningPoint.subtopic}`}
                    </p>
                  </div>
                  <button
                    onClick={() => startTransition(() => removeDraftFromSet(setId, item.draft.id))}
                    disabled={isPending}
                    className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-xs"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-500">問題がありません。</p>}
          </div>
        </div>
      </section>

      {/* Add Drafts Search */}
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

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {searchResults.map((draft) => {
              const isAdded = existingDraftIds.has(draft.id);
              return (
                <div key={draft.id} className={`rounded-xl border p-4 ${isAdded ? 'bg-slate-50 opacity-60' : ''}`}>
                  <p className="text-sm font-medium line-clamp-2">{draft.stem}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    {draft.learningPoint.topic} {draft.learningPoint.subtopic && `> ${draft.learningPoint.subtopic}`}
                  </p>
                  <button
                    onClick={() => startTransition(() => addDraftToSet(setId, draft.id))}
                    disabled={isPending || isAdded}
                    className={`text-xs px-3 py-1.5 rounded-lg ${
                      isAdded ? "bg-slate-200 text-slate-500" : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                    }`}
                  >
                    {isAdded ? "追加済み" : "セットに追加"}
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

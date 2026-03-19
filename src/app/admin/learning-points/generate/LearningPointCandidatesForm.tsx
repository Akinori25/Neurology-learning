"use client";

import { useMemo, useState } from "react";
import { saveLearningPointCandidates, type LearningPointCandidate } from "./actions";

function formatDifficulty(value: string) {
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

type Props = {
  generatorType: string;
  topic: string;
  subtopic: string;
  candidates: LearningPointCandidate[];
};

export default function LearningPointCandidatesForm({
  generatorType,
  topic,
  subtopic,
  candidates,
}: Props) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(
    candidates.map((_, index) => index)
  );

  const candidatesJson = useMemo(() => JSON.stringify(candidates), [candidates]);

  const allSelected = selectedIndexes.length === candidates.length && candidates.length > 0;
  const noneSelected = selectedIndexes.length === 0;

  function toggleIndex(index: number) {
    setSelectedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((value) => value !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  }

  function selectAll() {
    setSelectedIndexes(candidates.map((_, index) => index));
  }

  function clearAll() {
    setSelectedIndexes([]);
  }

  return (
    <form action={saveLearningPointCandidates} className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">生成候補</h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            全選択
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={noneSelected}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            全解除
          </button>

          <button
            type="submit"
            className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
          >
            選択した候補をまとめて保存
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {selectedIndexes.length} / {candidates.length} 件を選択中
      </p>

      <input type="hidden" name="generatorType" value={generatorType} />
      <input type="hidden" name="topic" value={topic} />
      <input type="hidden" name="subtopic" value={subtopic} />
      <input type="hidden" name="candidatesJson" value={candidatesJson} />

      {selectedIndexes.map((index) => (
        <input
          key={index}
          type="hidden"
          name="selectedIndexes"
          value={String(index)}
        />
      ))}

      {candidates.map((candidate, index) => {
        const checked = selectedIndexes.includes(index);

        return (
          <div
            key={`${candidate.title}-${index}`}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  {formatDifficulty(candidate.difficulty)}
                </span>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleIndex(index)}
                  className="h-4 w-4"
                />
                保存対象
              </label>
            </div>

            <h3 className="text-lg font-semibold">{candidate.title}</h3>

            <div className="mt-4 space-y-4 text-sm leading-7">
              <div>
                <p className="mb-1 font-medium">learning point</p>
                <p>{candidate.learningPoint}</p>
              </div>

              <div>
                <p className="mb-1 font-medium">意図</p>
                <p>{candidate.rationale}</p>
              </div>

              <div>
                <p className="mb-1 font-medium">タグ</p>
                <p>{candidate.tags.join(", ") || "なし"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </form>
  );
}
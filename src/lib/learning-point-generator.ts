import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";

export type LearningPointCandidate = {
  title: string;
  learningPoint: string;
  rationale: string;
  difficulty: "CORE" | "STANDARD" | "HARD" | "INSANE";
  questionStyle: "FACT" | "CASE" | "DIFFERENTIAL" | "TREATMENT" | "IMAGE";
  tags: string[];
};

type GenerateLearningPointCandidatesInput = {
  topic: string;
  subtopic?: string;
  sourceId?: string | null;
  keywords?: string;
  count?: number;
  targetDifficulty?: "CORE" | "STANDARD" | "HARD" | "INSANE";
};

function normalizeCount(count?: number) {
  if (!count || Number.isNaN(count)) return 5;
  return Math.min(Math.max(count, 1), 20);
}

function sanitizeKeywords(keywords?: string) {
  if (!keywords) return "";
  return keywords
    .split(/[,\n、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function isValidDifficulty(
  value: unknown
): value is LearningPointCandidate["difficulty"] {
  return ["CORE", "STANDARD", "HARD", "INSANE"].includes(String(value));
}

function isValidQuestionStyle(
  value: unknown
): value is LearningPointCandidate["questionStyle"] {
  return ["FACT", "CASE", "DIFFERENTIAL", "TREATMENT", "IMAGE"].includes(
    String(value)
  );
}

function sanitizeCandidate(
  candidate: LearningPointCandidate
): LearningPointCandidate {
  return {
    title: candidate.title.trim(),
    learningPoint: candidate.learningPoint.trim(),
    rationale: candidate.rationale.trim(),
    difficulty: candidate.difficulty,
    questionStyle: candidate.questionStyle,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [],
  };
}

function isValidCandidate(candidate: unknown): candidate is LearningPointCandidate {
  if (!candidate || typeof candidate !== "object") return false;

  const c = candidate as Record<string, unknown>;

  return (
    typeof c.title === "string" &&
    typeof c.learningPoint === "string" &&
    typeof c.rationale === "string" &&
    isValidDifficulty(c.difficulty) &&
    isValidQuestionStyle(c.questionStyle) &&
    Array.isArray(c.tags)
  );
}

export async function generateLearningPointCandidates({
  topic,
  subtopic,
  sourceId,
  keywords,
  count = 5,
  targetDifficulty,
}: GenerateLearningPointCandidatesInput): Promise<LearningPointCandidate[]> {
  const safeCount = normalizeCount(count);
  const normalizedKeywords = sanitizeKeywords(keywords);

  let sourceContext = "資料なし";
  let sourceTitle = "未設定";

  if (sourceId) {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          take: 8,
        },
      },
    });

    if (source) {
      sourceTitle = source.title;
      sourceContext =
        source.chunks.length > 0
          ? source.chunks
              .map((chunk, i) => {
                return [
                  `[#${i + 1}] ${source.title}`,
                  chunk.chapter ? `章: ${chunk.chapter}` : null,
                  chunk.pageStart ? `ページ: ${chunk.pageStart}` : null,
                  chunk.pageEnd ? `- ${chunk.pageEnd}` : null,
                  chunk.text,
                ]
                  .filter(Boolean)
                  .join("\n");
              })
              .join("\n\n")
          : "資料は指定されていますが、参照可能なチャンクはありません。";
    }
  }

  const difficultyInstruction = targetDifficulty
    ? `生成する候補の難易度は ${targetDifficulty} に統一してください。`
    : "難易度は候補ごとに適切に判断してください。";

  const systemPrompt = `
あなたは神経内科専門医試験の編集委員です。
与えられた分野・資料から、専門医試験で問う価値のある learning point 候補を作成してください。

【基本方針】
- 日本語で出力する
- 1候補につき1つの明確な論点のみ扱う
- 実際に4択問題へ落とし込みやすい具体的な粒度にする
- 候補同士は重複しないようにする
- 広すぎる総論や曖昧な知識項目は避ける
- 参考資料がある場合は内容に反しないこと
- 不確かな情報は推測で補わない
- 出力はJSONのみとする

【difficulty の基準】
CORE:
専門医として必ず知っておくべき基本事項

STANDARD:
頻出で標準的な知識

HARD:
複数知識の統合や例外理解を要する

INSANE:
高度で細部まで問う知識

【questionStyle の基準】
FACT:
単一知識を問う問題

CASE:
症例文から診断・判断を行う問題

DIFFERENTIAL:
鑑別診断の比較を問う問題

TREATMENT:
治療選択・適応・禁忌を問う問題

IMAGE:
画像・波形・病理・検査所見の解釈を問う問題

【各フィールドの定義】
title:
12〜32文字程度の簡潔な論点名

learningPoint:
正答の核になる知識を1〜2文で述べる

rationale:
なぜ試験で問う価値があるのかを1文で説明する

tags:
検索・分類に使える短い語を3〜6個

【禁止事項】
- 疾患総論
- 疫学のみ
- 曖昧な知識
- 4択問題に落とし込みにくい主張
- 候補間で主語だけ異なる重複論点
- 参考資料と整合しない内容

【多様性ルール】
候補間で論点が偏らないようにする。
同一疾患を扱う場合でも、以下の観点を分けること
- 病態
- 臨床症状
- 検査
- 鑑別
- 治療
- 画像

出力はJSONのみ。
`;

  const userPrompt = `
【入力情報】
topic:
${topic}

subtopic:
${subtopic ?? "未設定"}

keywords:
${normalizedKeywords || "なし"}

source title:
${sourceTitle ?? "なし"}

candidate count:
${safeCount}

【難易度指定】
${difficultyInstruction}

【参考資料】
${sourceContext || "なし"}

【タスク】
上記情報をもとに、
専門医試験で出題価値のある learning point 候補を
${safeCount}件作成してください。

追加ルール:
- 候補ごとに論点を明確に変える
- 同一疾患でも観点（病態・検査・鑑別など）を変える
- learningPoint は問題作成時の核知識として使える密度にする
- rationale は受験者の理解差を測れる理由を書く
- tags は簡潔な語を付与する
- 出力前に、候補間の重複・粒度・資料との整合性を自己点検する

出力形式:
{
  "candidates": [
    {
      "title": "",
      "learningPoint": "",
      "rationale": "",
      "difficulty": "CORE | STANDARD | HARD | INSANE",
      "questionStyle": "FACT | CASE | DIFFERENTIAL | TREATMENT | IMAGE",
      "tags": ["", ""]
    }
  ]
}

必ずJSONのみ出力する。
`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawText =
    typeof response.output_text === "string" ? response.output_text : "";

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("LLMの出力がJSONとして解釈できませんでした。");
  }

  const candidatesRaw =
    parsed &&
    typeof parsed === "object" &&
    "candidates" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).candidates)
      ? (parsed as { candidates: unknown[] }).candidates
      : null;

  if (!candidatesRaw) {
    throw new Error("LLMの出力に candidates 配列がありませんでした。");
  }

  const validCandidates = candidatesRaw
    .filter(isValidCandidate)
    .map((candidate) => sanitizeCandidate(candidate));

  if (validCandidates.length === 0) {
    throw new Error("有効な learning point 候補を取得できませんでした。");
  }

  return validCandidates.slice(0, safeCount);
}
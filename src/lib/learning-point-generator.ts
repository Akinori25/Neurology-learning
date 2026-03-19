import { Difficulty } from "@prisma/client";

export type LearningPointCandidate = {
  title: string;
  learningPoint: string;
  rationale: string;
  difficulty: "CORE" | "STANDARD" | "HARD" | "INSANE";
  tags: string[];
  references: string[];
};

type GenerateLearningPointCandidatesInput = {
  topic: string;
  subtopic?: string;
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

function sanitizeCandidate(
  candidate: LearningPointCandidate
): LearningPointCandidate {
  return {
    title: candidate.title.trim(),
    learningPoint: candidate.learningPoint.trim(),
    rationale: candidate.rationale.trim(),
    difficulty: candidate.difficulty,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [],
    references: Array.isArray(candidate.references)
      ? Array.from(
          new Set(
            candidate.references
              .map((ref) => String(ref).trim())
              .filter((ref) => ref.startsWith("http://") || ref.startsWith("https://"))
          )
        ).slice(0, 5)
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
    Array.isArray(c.tags) &&
    (Array.isArray(c.references) || c.references === undefined)
  );
}

export async function generateLearningPointCandidates({
  topic,
  subtopic,
  keywords,
  count = 5,
  targetDifficulty,
}: GenerateLearningPointCandidatesInput): Promise<{
  candidates: LearningPointCandidate[];
  generatedByModel: string;
  generationMeta: Record<string, unknown>;
}> {
  const safeCount = normalizeCount(count);
  const normalizedKeywords = sanitizeKeywords(keywords);

  const difficultyInstruction = targetDifficulty
    ? `生成する候補の難易度は ${targetDifficulty} に統一してください。`
    : "難易度は候補ごとに適切に判断してください。";

  const systemPrompt = `
あなたは神経内科専門医試験の編集委員です。
与えられた分野から、専門医試験で問う価値のある learning point 候補を作成してください。

【基本方針】
- 日本語で出力する
- 1候補につき1つの明確な論点のみ扱う
- 実際に4択問題へ落とし込みやすい具体的な粒度にする
- 候補同士は重複しないようにする
- 広すぎる総論や曖昧な知識項目は避ける
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

candidate count:
${safeCount}

【難易度指定】
${difficultyInstruction}

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
- 出力前に、候補間の重複・粒度を自己点検する
- 可能であれば、その知識を裏付ける信頼できるURLを references として2〜3件含める（なければ空配列でよい）

出力形式:
{
  "candidates": [
    {
      "title": "",
      "learningPoint": "",
      "rationale": "",
      "difficulty": "CORE | STANDARD | HARD | INSANE",
      "tags": ["", ""],
      "references": ["url1", "url2"]
    }
  ]
}

必ず上記のJSON形式のみで出力すること。Markdownのバッククォート等の余分な文字は含めないでください。
`;

  const model = process.env.PERPLEXITY_MODEL ?? "sonar-pro";

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  let rawText = data.choices?.[0]?.message?.content || "";

  // Remove markdown code blocks if present
  rawText = rawText.replace(/^\s*```json/im, "").replace(/```\s*$/m, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse JSON:", rawText);
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

  const generationMeta = {
    model,
    requestedCount: safeCount,
    returnedCount: validCandidates.length,
    topic,
    subtopic,
    keywords,
    targetDifficulty,
    generatedAt: new Date().toISOString(),
  };

  return {
    candidates: validCandidates.slice(0, safeCount),
    generatedByModel: model,
    generationMeta,
  };
}
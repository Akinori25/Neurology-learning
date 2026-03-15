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

function sanitizeCandidate(candidate: LearningPointCandidate): LearningPointCandidate {
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

  const systemPrompt = `
あなたは神経内科専門医試験の出題設計者です。
与えられた分野・資料から、試験で問う価値のある learning point 候補を複数作成してください。

ルール:
- 日本語で作成する
- 1候補につき1つの論点に絞る
- 広すぎる総論は避ける
- 実際に4択問題へ落とし込みやすい粒度にする
- 参考資料がある場合は資料に反しない
- 候補同士の重複を避ける
- 指定難易度がある場合は全候補をその難易度に揃える
- title は簡潔で明確にする
- learningPoint は問題作成の核になる知識を1～3文で述べる
- rationale は「なぜその論点を問う価値があるか」を簡潔に述べる
- tags は検索や分類に使える短い語を付ける
- 出力はJSONのみ
`;

  const difficultyInstruction = targetDifficulty
    ? `生成する候補の難易度は ${targetDifficulty} に統一してください。`
    : "難易度は候補ごとに適切に判断してください。";

  const userPrompt = `
【入力情報】
topic: ${topic}
subtopic: ${subtopic ?? "未設定"}
keywords: ${normalizedKeywords || "なし"}
source title: ${sourceTitle}
candidate count: ${safeCount}

【難易度指定】
${difficultyInstruction}

【参考資料】
${sourceContext}

以下の形式で、learning point 候補を ${safeCount} 件作成してください。
各候補には以下を含めてください。

- title
- learningPoint
- rationale
- difficulty
- questionStyle
- tags

difficulty は CORE / STANDARD / HARD / INSANE
questionStyle は FACT / CASE / DIFFERENTIAL / TREATMENT / IMAGE
`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1",
    instructions: systemPrompt,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "learning_point_candidates",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            candidates: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  learningPoint: { type: "string" },
                  rationale: { type: "string" },
                  difficulty: {
                    type: "string",
                    enum: ["CORE", "STANDARD", "HARD", "INSANE"],
                  },
                  questionStyle: {
                    type: "string",
                    enum: ["FACT", "CASE", "DIFFERENTIAL", "TREATMENT", "IMAGE"],
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "title",
                  "learningPoint",
                  "rationale",
                  "difficulty",
                  "questionStyle",
                  "tags",
                ],
              },
            },
          },
          required: ["candidates"],
        },
      },
    },
  });

  const content = response.output_text?.trim();

  if (!content) {
    throw new Error("LLMから候補が返りませんでした。");
  }

  let parsed: { candidates: LearningPointCandidate[] };

  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("Invalid JSON from LLM:", content);
    throw new Error("learning point 候補のJSON解析に失敗しました。");
  }

  if (!parsed || !Array.isArray(parsed.candidates)) {
    throw new Error("learning point 候補の形式が不正です。");
  }

  const candidates = parsed.candidates
    .filter((candidate): candidate is LearningPointCandidate => {
      return (
        !!candidate &&
        typeof candidate.title === "string" &&
        typeof candidate.learningPoint === "string" &&
        typeof candidate.rationale === "string" &&
        isValidDifficulty(candidate.difficulty) &&
        isValidQuestionStyle(candidate.questionStyle) &&
        Array.isArray(candidate.tags)
      );
    })
    .map(sanitizeCandidate)
    .filter(
      (candidate) =>
        candidate.title.length > 0 && candidate.learningPoint.length > 0
    );

  if (candidates.length === 0) {
    throw new Error("有効な learning point 候補を取得できませんでした。");
  }

  return candidates;
}
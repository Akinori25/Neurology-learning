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

export async function generateLearningPointCandidates({
  topic,
  subtopic,
  sourceId,
  keywords,
  count = 5,
  targetDifficulty,
}: GenerateLearningPointCandidatesInput): Promise<LearningPointCandidate[]> {
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
      sourceContext = source.chunks
        .map((chunk, i) => {
          return [
            `[#${i + 1}] ${source.title}`,
            chunk.chapter ? `章: ${chunk.chapter}` : null,
            chunk.pageStart ? `ページ: ${chunk.pageStart}` : null,
            chunk.text,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n");
    }
  }

  const systemPrompt = `
あなたは神経内科専門医試験の出題設計者です。
与えられた分野・資料から、試験で問う価値のある learning point 候補を複数作成してください。

ルール:
- 日本語
- 1候補につき「1つの論点」に絞る
- 広すぎる総論は避ける
- 問題化しやすい粒度にする
- 資料に反しない
- 重複を避ける
- 指定された難易度がある場合はその難易度に揃える
- 出力はJSONのみ
`;

  const difficultyInstruction = targetDifficulty
    ? `生成する候補の難易度は ${targetDifficulty} に統一してください。`
    : "難易度は候補ごとに適切に判断してください。";

  const userPrompt = `
【入力情報】
topic: ${topic}
subtopic: ${subtopic ?? "未設定"}
keywords: ${keywords ?? "なし"}
source title: ${sourceTitle}
candidate count: ${count}

【難易度指定】
${difficultyInstruction}

【参考資料】
${sourceContext}

以下の形式で、learning point 候補を ${count} 件作成してください。
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

  return parsed.candidates;
}
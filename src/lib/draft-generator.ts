import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";

type GeneratedDraft = {
  stem: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  explanationA?: string;
  explanationB?: string;
  explanationC?: string;
  explanationD?: string;
};

export async function retrieveRelevantChunks(learningPointId: string) {
  const lp = await prisma.learningPoint.findUnique({
    where: { id: learningPointId },
    include: {
      source: true,
      imageLinks: {
        include: { imageAsset: true },
      },
    },
  });

  if (!lp) {
    throw new Error("論点が見つかりません。");
  }

  const keywords = [
    lp.topic,
    lp.subtopic ?? "",
    lp.title,
    ...lp.tags,
  ].filter(Boolean);

  const chunks = await prisma.sourceChunk.findMany({
    where: {
      ...(lp.sourceId ? { sourceId: lp.sourceId } : {}),
      OR: keywords.map((k) => ({
        text: {
          contains: k,
          mode: "insensitive" as const,
        },
      })),
    },
    include: {
      source: true,
    },
    take: 5,
  });

  return { lp, chunks };
}

async function auditDraft(
  draft: GeneratedDraft,
  contextText: string
): Promise<{
  draft: GeneratedDraft;
  auditReason: string;
  corrected: boolean;
  difficultyScore: number;
  clinicalAccuracyScore: number;
  discriminationScore: number;
}> {
  const auditPrompt = `
あなたは医学試験問題の監査者です。
以下の神経内科4択問題をレビューしてください。

【問題案】
${JSON.stringify(draft, null, 2)}

【根拠資料】
${contextText || "根拠資料なし"}

【チェック項目】
1. 正答は1つのみか
2. 他の選択肢は明確に誤りか
3. 医学的に正しいか
4. 根拠資料と矛盾しないか
5. 問題文は明確か
6. 解説は正答・誤答の理由として妥当か

【スコアリング】
difficulty_score:
1=非常に易しい
2=やや易しい
3=標準
4=難しい
5=非常に難しい

clinical_accuracy_score:
1=医学的問題が大きい
2=不正確な点が多い
3=概ね妥当
4=良好
5=非常に正確

discrimination_score:
1=誤答が弱く問題として機能しない
2=やや弱い
3=標準的
4=良い
5=非常に良い

問題がなければ is_valid=true を返してください。
問題がある場合は is_valid=false とし、corrected_draft に修正版の完全な問題を入れてください。

出力はJSONのみ。
`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1",
    input: auditPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "audit_result",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            is_valid: { type: "boolean" },
            reason: { type: "string" },

            difficulty_score: {
              type: "integer",
              minimum: 1,
              maximum: 5,
            },
            clinical_accuracy_score: {
              type: "integer",
              minimum: 1,
              maximum: 5,
            },
            discrimination_score: {
              type: "integer",
              minimum: 1,
              maximum: 5,
            },

            corrected_draft: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    stem: { type: "string" },
                    choiceA: { type: "string" },
                    choiceB: { type: "string" },
                    choiceC: { type: "string" },
                    choiceD: { type: "string" },
                    correctAnswer: {
                      type: "string",
                      enum: ["A", "B", "C", "D"],
                    },
                    explanation: { type: "string" },
                    explanationA: { type: "string" },
                    explanationB: { type: "string" },
                    explanationC: { type: "string" },
                    explanationD: { type: "string" },
                  },
                  required: [
                    "stem",
                    "choiceA",
                    "choiceB",
                    "choiceC",
                    "choiceD",
                    "correctAnswer",
                    "explanation",
                    "explanationA",
                    "explanationB",
                    "explanationC",
                    "explanationD",
                  ],
                },
                {
                  type: "null",
                },
              ],
            },
          },
          required: [
            "is_valid",
            "reason",
            "difficulty_score",
            "clinical_accuracy_score",
            "discrimination_score",
            "corrected_draft",
          ],
        },
      },
    },
  });

  const content = response.output_text?.trim();

  if (!content) {
    return {
      draft,
      auditReason: "監査レスポンスが空だったため元の草案を採用",
      corrected: false,
      difficultyScore: 3,
      clinicalAccuracyScore: 2,
      discriminationScore: 2,
    };
  }

  let result: {
    is_valid: boolean;
    reason: string;
    difficulty_score: number;
    clinical_accuracy_score: number;
    discrimination_score: number;
    corrected_draft?: GeneratedDraft | null;
  };

  try {
    result = JSON.parse(content);
  } catch {
    return {
      draft,
      auditReason: "監査JSONの解析に失敗したため元の草案を採用",
      corrected: false,
      difficultyScore: 3,
      clinicalAccuracyScore: 2,
      discriminationScore: 2,
    };
  }

  if (result.is_valid) {
    return {
      draft,
      auditReason: result.reason,
      corrected: false,
      difficultyScore: result.difficulty_score,
      clinicalAccuracyScore: result.clinical_accuracy_score,
      discriminationScore: result.discrimination_score,
    };
  }

  if (!result.corrected_draft) {
    return {
      draft,
      auditReason: `修正版が返らなかったため元の草案を採用: ${result.reason}`,
      corrected: false,
      difficultyScore: result.difficulty_score,
      clinicalAccuracyScore: result.clinical_accuracy_score,
      discriminationScore: result.discrimination_score,
    };
  }

  return {
    draft: result.corrected_draft,
    auditReason: result.reason,
    corrected: true,
    difficultyScore: result.difficulty_score,
    clinicalAccuracyScore: result.clinical_accuracy_score,
    discriminationScore: result.discrimination_score,
  };
}

export async function generateDraftWithLLM(learningPointId: string) {
  const { lp, chunks } = await retrieveRelevantChunks(learningPointId);
  const now = new Date();

  if (lp.lastGeneratedAt) {
    const diffMs = now.getTime() - new Date(lp.lastGeneratedAt).getTime();
    const diffSeconds = diffMs / 1000;

    if (diffSeconds < 60) {
      throw new Error(
        `この論点では直近${Math.ceil(diffSeconds)}秒前に生成されています。少し待ってから再実行してください。`
      );
    }
  }
  const firstImage = lp.imageLinks[0]?.imageAsset ?? null;

  const hasEvidence = chunks.length > 0;

  const contextText = hasEvidence
    ? chunks
        .map((chunk, i) => {
          return [
            `[#${i + 1}] ${chunk.source.title}`,
            chunk.chapter ? `章: ${chunk.chapter}` : null,
            chunk.pageStart ? `ページ: ${chunk.pageStart}` : null,
            chunk.text,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n")
    : "根拠資料は取得できませんでした。論点と画像情報のみを用いて、推測を避けて作成してください。";

  const imageContext = firstImage
    ? `
画像情報:
- title: ${firstImage.title}
- modality: ${firstImage.modality}
- diagnosis: ${firstImage.diagnosis ?? "未設定"}
- findings: ${firstImage.findings ?? "未設定"}
`
    : "画像情報: なし";

  const systemPrompt = `
あなたは神経内科専門医試験の問題作成者です。
以下の規則を厳守してください。

【問題作成ルール】

1. 日本語で作成
2. 4択単一正答
3. 正答は1つのみ
4. 誤答は臨床的にもっともらしいが誤り
5. RAG資料と矛盾する内容は禁止
6. 推測は禁止
7. 画像問題の場合は画像所見を必ず問題に反映
8. 専門医試験レベル

【問題形式】

問題文
↓
A
B
C
D

【誤答設計】

誤答は以下のどれかにする

・頻度が低い疾患
・類似疾患
・古い知識
・検査適応の誤り
・治療選択の誤り

【自己検証】

出力前に必ず確認

1. 正答が1つか
2. 他の選択肢が誤りか
3. RAG資料と矛盾しないか

問題に問題があれば修正してから出力する。

【出力】

JSONのみ出力
  `;

  const styleInstruction =
    lp.questionStyle === "CASE"
      ? "症例形式の問題にしてください（患者背景・経過・検査などを含める）。"
      : lp.questionStyle === "IMAGE"
      ? "画像所見を中心に診断または鑑別を問う問題にしてください。"
      : lp.questionStyle === "TREATMENT"
      ? "治療方針や薬剤選択を問う問題にしてください。"
      : "知識問題として簡潔に作成してください。";

  const difficultyInstruction =
    lp.difficulty === "CORE"
      ? "必修レベルの問題にしてください。専門医試験で頻出の知識を問う問題。"
      : lp.difficulty === "STANDARD"
      ? "一般レベルの問題にしてください。鑑別診断や病態理解を必要とする問題。"
      : lp.difficulty === "HARD"
      ? "難問レベルの問題にしてください。最新の文献の知識や高度な臨床推論、最新の基礎研究や治験薬の知識を必要とする問題。"
      : "超難問レベルの問題にしてください。重箱の隅をこれでもかというぐらいのつつく神経内科専門医であっても1%も正答できなさそうな問題。";

  const userPrompt = `
  【論点】

  topic: ${lp.topic}
  subtopic: ${lp.subtopic}
  title: ${lp.title}

  learning point:
  ${lp.learningPoint}

  ---

  【問題形式】

  ${styleInstruction}

  ---

  【問題難易度】

  ${difficultyInstruction}

  ---

  【画像情報】

  ${imageContext}

  ---

  【根拠資料】

  ${contextText}

  ---

  神経内科専門医試験演習用の
  4択単一正答問題を1問作成してください。
  `;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1",
    instructions: systemPrompt,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "draft_question",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            stem: { type: "string" },
            choiceA: { type: "string" },
            choiceB: { type: "string" },
            choiceC: { type: "string" },
            choiceD: { type: "string" },
            correctAnswer: {
              type: "string",
              enum: ["A", "B", "C", "D"],
            },
            explanation: { type: "string" },
            explanationA: { type: "string" },
            explanationB: { type: "string" },
            explanationC: { type: "string" },
            explanationD: { type: "string" },
          },
          required: [
            "stem",
            "choiceA",
            "choiceB",
            "choiceC",
            "choiceD",
            "correctAnswer",
            "explanation",
            "explanationA",
            "explanationB",
            "explanationC",
            "explanationD",
          ],
        },
      },
    },
  });

  const content = response.output_text?.trim();

  if (!content) {
    throw new Error("LLMから出力が返りませんでした。");
  }

  let draft: GeneratedDraft;
  try {
    draft = JSON.parse(content) as GeneratedDraft;
  } catch (e) {
    console.error("Invalid JSON from LLM:", content);
    throw new Error("LLM出力のJSON解析に失敗しました。");
  }

  const auditResult = await auditDraft(draft, contextText);
  draft = auditResult.draft;

  const created = await prisma.questionDraft.create({
    data: {
      learningPointId: lp.id,
      imageAssetId: firstImage?.id ?? null,
      version: 1,
      stem: draft.stem,
      choiceA: draft.choiceA,
      choiceB: draft.choiceB,
      choiceC: draft.choiceC,
      choiceD: draft.choiceD,
      correctAnswer: draft.correctAnswer,
      explanation: draft.explanation,
      explanationA: draft.explanationA ?? null,
      explanationB: draft.explanationB ?? null,
      explanationC: draft.explanationC ?? null,
      explanationD: draft.explanationD ?? null,
      llmModel: process.env.OPENAI_MODEL ?? "gpt-4.1",
      promptVersion: "rag-v2-audited",
      generationMeta: {
        model: process.env.OPENAI_MODEL ?? "gpt-4.1",
        promptVersion: "rag-v2-audited",
        retrievedChunkIds: chunks.map((c) => c.id),
        retrievedChunkCount: chunks.length,
        hasEvidence,
        imageAssetId: firstImage?.id ?? null,
        audited: true,
        auditCorrected: auditResult.corrected,
        auditReason: auditResult.auditReason,
        generatedAt: new Date().toISOString(),
        questionStyle: lp.questionStyle,
        difficulty: lp.difficulty,
        topic: lp.topic,
        subtopic: lp.subtopic ?? null,
        difficultyScore: auditResult.difficultyScore,
        clinicalAccuracyScore: auditResult.clinicalAccuracyScore,
        discriminationScore: auditResult.discriminationScore,
      },
      status: "DRAFT",
      reviewerComment: "LLM生成＋監査済み草案です。公開前に必ずレビューしてください。",
      hasImage: !!firstImage,
    },
  });

  await prisma.learningPoint.update({
    where: { id: lp.id },
    data: {
      lastGeneratedAt: now,
    },
  });

  if (chunks.length > 0) {
    await prisma.questionDraftCitation.createMany({
      data: chunks.map((chunk) => ({
        questionDraftId: created.id,
        sourceChunkId: chunk.id,
        note: "自動取得された根拠資料",
      })),
    });
  }

  return created;
}
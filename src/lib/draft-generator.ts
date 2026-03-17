import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { Difficulty } from "@prisma/client";

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

  const keywords = [lp.topic, lp.subtopic ?? "", lp.title, ...lp.tags].filter(
    (v): v is string => !!v && v.trim().length > 0
  );

  const chunks = await prisma.sourceChunk.findMany({
    where: {
      ...(lp.sourceId ? { sourceId: lp.sourceId } : {}),
      ...(keywords.length > 0
        ? {
            OR: keywords.map((k) => ({
              text: {
                contains: k,
                mode: "insensitive" as const,
              },
            })),
          }
        : {}),
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

export async function generateDraftWithLLM(
  learningPointId: string,
  createdById?: string | null,
  difficultyOverride?: Difficulty | null
) {
  const { lp, chunks } = await retrieveRelevantChunks(learningPointId);
  const now = new Date();

  if (lp.lastGeneratedAt) {
    const diffMs = now.getTime() - new Date(lp.lastGeneratedAt).getTime();
    const diffSeconds = diffMs / 1000;

    if (diffSeconds < 60) {
      throw new Error(
        `この論点では直近${Math.ceil(
          diffSeconds
        )}秒前に生成されています。少し待ってから再実行してください。`
      );
    }
  }

  const effectiveDifficulty = difficultyOverride ?? lp.difficulty;
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
以下の規則を厳守して、4択単一正答問題を1問作成してください。

【基本原則】
- 日本語で作成する
- 神経内科専門医試験レベルとする
- 与えられた learning point を正答の核として問題を作成する
- 根拠資料に反する内容を書かない
- 根拠資料にない内容を推測で補わない
- 出力はJSONのみとする

【問題作成ルール】
- 4択単一正答とする
- 正答は必ず1つだけにする
- 問題文だけで正答に到達できるようにする
- 選択肢の文体・長さ・具体性はできるだけ揃える
- 正答だけが露骨に具体的にならないようにする
- 明らかにおかしい誤答は禁止する
- 条件次第で正しくなりうる誤答は禁止する
- 否定形の設問は必要最小限にする
- 画像問題では画像情報を問題文と解説に必ず反映する

【正答の原則】
- まず、この設問で正答を正答たらしめる決定的根拠を1つ定める
- 正答は、その決定的根拠を最も直接に満たす選択肢にする
- learning point から逸れた周辺知識を正答の中心にしない

【誤答の品質基準】
誤答は、知識が不十分な受験者や典型例に引きずられる受験者が実際に選びうる、
臨床的にもっともらしい選択肢にすること。
一目で除外できる荒唐無稽な誤答は禁止する。

誤答は以下を満たすこと。
- 正答と同じ領域・同じ文脈に属している
- 一見すると正しそうに見える
- ただし、設問条件を丁寧に読むと誤りと判断できる
- 誤答3つは異なる理由で誤っている
- 正答との差が1つの決定的ポイントで生じるようにする

【誤答の型】
誤答は以下の型から作成すること。
- 典型例の過剰一般化
- 類似疾患との混同
- 病態の取り違え
- 検査適応や所見解釈の誤り
- 治療適応・禁忌・第一選択の取り違え
- 病期や重症度の無視
- 中枢性と末梢性の取り違え
- よく知られた知識の誤適用

【誤答の難度設計】
誤答3つは以下の役割をできるだけ分けること。
- 初学者が選びやすい誤答
- 中級者が迷いやすい誤答
- 上級者でも条件の読み落としで迷いうる誤答

【神経内科領域で優先する誤答設計】
神経内科領域では、誤答は単なる無関係疾患ではなく、
局在、時間経過、神経所見、検査所見、画像分布、病態、治療適応のうち
1つだけ決定的に合わない選択肢を優先すること。

【自己検証】
出力前に必ず以下を確認すること。
1. 正答が1つのみである
2. 誤答3つがすべて誤りである
3. 正答が learning point を最も直接に問うている
4. 問題文・選択肢・解説が根拠資料と矛盾しない
5. 4選択肢の文体・長さ・具体性に不自然な偏りがない
6. 画像問題では画像情報が十分に反映されている

【出力形式】
以下のJSONのみを出力すること。

{
  "stem": "",
  "choiceA": "",
  "choiceB": "",
  "choiceC": "",
  "choiceD": "",
  "correctAnswer": "A",
  "explanation": "",
  "explanationA": "",
  "explanationB": "",
  "explanationC": "",
  "explanationD": ""
}
`;

  const styleInstruction =
    lp.questionStyle === "CASE"
      ? "症例形式の問題にしてください。患者背景、経過、神経所見、検査所見のうち、正答に必要な情報のみを含めてください。"
      : lp.questionStyle === "IMAGE"
      ? "画像または検査所見の解釈を中心に、診断または鑑別を問う問題にしてください。画像情報から読むべきポイントを明確に反映してください。"
      : lp.questionStyle === "TREATMENT"
      ? "治療方針、薬剤選択、適応、禁忌、第一選択を問う問題にしてください。"
      : lp.questionStyle === "DIFFERENTIAL"
      ? "類似疾患や近縁概念との鑑別を問う問題にしてください。鑑別の決め手が明確になるようにしてください。"
      : "知識問題として簡潔かつ明確に作成してください。";

  const difficultyInstruction =
    effectiveDifficulty === "CORE"
      ? "必修レベルの問題にしてください。神経内科専門医試験で頻出の基本知識を問ってください。"
      : effectiveDifficulty === "STANDARD"
      ? "標準レベルの問題にしてください。典型例の理解や基本的な鑑別・病態理解を要する問題にしてください。"
      : effectiveDifficulty === "HARD"
      ? "難問レベルの問題にしてください。複数の知識の統合、例外、臨床推論を要する問題にしてください。"
      : "最難関レベルの問題にしてください。細かな例外、深い病態理解、専門的知識の統合を要する問題にしてください。";

  const userPrompt = `
【論点】
topic: ${lp.topic}
subtopic: ${lp.subtopic ?? "なし"}
title: ${lp.title}

【learning point】
${lp.learningPoint}

【出題意図】
${lp.rationale ?? "未設定"}

【問題形式】
${styleInstruction}

【問題難易度】
${difficultyInstruction}

【画像情報】
${imageContext || "なし"}

【根拠資料】
${contextText || "なし"}

【タスク】
上記の learning point を正答の核として、
神経内科専門医試験演習用の4択単一正答問題を1問作成してください。

追加条件:
- stem は簡潔だが、解答に必要な情報は不足させない
- まず、この設問で正答となる決定的根拠を1つ定め、その根拠を最も直接に問うこと
- 正答は learning point を最も直接に反映するものにする
- 正答以外の3選択肢は、それぞれ別の誤り方で誤っていること
- 誤答は、知識不足、典型例バイアス、類似概念との混同で選ばれうる内容にすること
- 誤答は、無関係すぎる選択肢や露骨に雑な選択肢にしないこと
- 少なくとも1つは上級者でも迷いうる高品質な誤答を含めること
- 4選択肢は同じレベルの具体性・長さ・文体に揃えること
- CASE の場合は、年齢・性別・主訴・経過・神経所見・検査所見のうち必要な要素のみを含める
- FACT の場合は、回りくどい症例文にしない
- DIFFERENTIAL の場合は、鑑別の決め手が明確になるようにする
- TREATMENT の場合は、適応・禁忌・第一選択・支持療法の区別が明確になるようにする
- IMAGE の場合は、画像情報から判断すべきポイントを問題文と解説に明示する
- explanation では、正答の根拠に加えて、他の3選択肢がなぜ誤りかも簡潔に説明する

必ず指定されたJSON形式のみを出力すること。
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
  } catch {
    console.error("Invalid JSON from LLM:", content);
    throw new Error("LLM出力のJSON解析に失敗しました。");
  }

  const auditResult = await auditDraft(draft, contextText);
  draft = auditResult.draft;

  const created = await prisma.questionDraft.create({
    data: {
      learningPointId: lp.id,
      imageAssetId: firstImage?.id ?? null,
      createdById: createdById ?? lp.createdById ?? null,
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
      promptVersion: "rag-v4-difficulty-override",
      generationMeta: {
        model: process.env.OPENAI_MODEL ?? "gpt-4.1",
        promptVersion: "rag-v4-difficulty-override",
        retrievedChunkIds: chunks.map((c) => c.id),
        retrievedChunkCount: chunks.length,
        hasEvidence,
        imageAssetId: firstImage?.id ?? null,
        audited: true,
        auditCorrected: auditResult.corrected,
        auditReason: auditResult.auditReason,
        generatedAt: new Date().toISOString(),
        questionStyle: lp.questionStyle,
        difficulty: effectiveDifficulty,
        originalLearningPointDifficulty: lp.difficulty,
        learningPointOverrideUsed: difficultyOverride ?? null,
        topic: lp.topic,
        subtopic: lp.subtopic ?? null,
        learningPointOrigin: lp.origin,
        difficultyScore: auditResult.difficultyScore,
        clinicalAccuracyScore: auditResult.clinicalAccuracyScore,
        discriminationScore: auditResult.discriminationScore,
      },
      hasImage: !!firstImage,
      isPublished: false,
      publishedAt: null,
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

  return created.id;
}
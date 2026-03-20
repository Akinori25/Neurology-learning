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

async function auditDraft(
  draft: GeneratedDraft
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

【チェック項目】
1. 正答は1つのみか
2. 他の選択肢は明確に誤りか
3. 医学的に正しいか
4. 問題文は明確か
5. 解説は正答・誤答の理由として妥当か

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

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: auditPrompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "audit_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              is_valid: { type: "boolean" },
              reason: { type: "string" },
              difficulty_score: { type: "integer" },
              clinical_accuracy_score: { type: "integer" },
              discrimination_score: { type: "integer" },
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
                      correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] },
                      explanation: { type: "string" },
                      explanationA: { type: "string" },
                      explanationB: { type: "string" },
                      explanationC: { type: "string" },
                      explanationD: { type: "string" },
                    },
                    required: ["stem", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanation", "explanationA", "explanationB", "explanationC", "explanationD"],
                  },
                  { type: "null" },
                ],
              },
            },
            required: ["is_valid", "reason", "difficulty_score", "clinical_accuracy_score", "discrimination_score", "corrected_draft"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty audit response");
    }

    const result = JSON.parse(content);
    
    if (result.is_valid || (!result.is_valid && !result.corrected_draft)) {
      return {
        draft,
        auditReason: result.reason,
        corrected: false,
        difficultyScore: result.difficulty_score,
        clinicalAccuracyScore: result.clinical_accuracy_score,
        discriminationScore: result.discrimination_score,
      };
    } else {
      return {
        draft: result.corrected_draft,
        auditReason: result.reason,
        corrected: true,
        difficultyScore: result.difficulty_score,
        clinicalAccuracyScore: result.clinical_accuracy_score,
        discriminationScore: result.discrimination_score,
      };
    }
  } catch (error) {
    return {
      draft,
      auditReason: "監査に失敗したため元の草案を採用: " + String(error),
      corrected: false,
      difficultyScore: 3,
      clinicalAccuracyScore: 3,
      discriminationScore: 3,
    };
  }
}

export async function generateDraftWithLLM(
  learningPointId: string,
  createdById?: string | null,
  difficultyOverride?: Difficulty | null
) {
  const lp = await prisma.learningPoint.findUnique({
    where: { id: learningPointId },
  });

  if (!lp) {
    throw new Error("論点が見つかりません。");
  }

  const now = new Date();



  const effectiveDifficulty = difficultyOverride ?? lp.difficulty;

  const difficultyInstruction =
    effectiveDifficulty === "CORE"
      ? "必修レベルの問題にしてください。神経内科専門医試験で頻出の基本知識を問ってください。"
      : effectiveDifficulty === "STANDARD"
      ? "標準レベルの問題にしてください。典型例の理解や基本的な鑑別・病態理解を要する問題にしてください。"
      : effectiveDifficulty === "HARD"
      ? "難問レベルの問題にしてください。複数の知識の統合、例外、臨床推論を要する問題にしてください。"
      : "最難関レベルの問題にしてください。細かな例外、深い病態理解、専門的知識の統合を要する問題にしてください。";

const systemPrompt = `
あなたは神経内科専門医試験の問題作成者です。
以下の規則を厳守して、4択単一正答問題を1問作成してください。

【基本原則】
- 日本語で作成する
- 神経内科専門医試験レベルとする
- 与えられた learning point を正答の核として問題を作成する
- 出力はJSONのみとする

【問題作成ルール】
- 4択単一正答とする
- 正答は必ず1つだけにする
- 問題文だけで正答に到達できるようにする
- 選択肢の文体・長さ・具体性はできるだけ揃える
- 正答だけが露骨に具体的にならないようにする
- 明らかにおかしい誤答は禁止する
- 否定形の設問は必要最小限にする

【正答の原則】
- まず、この設問で正答を正答たらしめる決定的根拠を1つ定める
- 正答は、その決定的根拠を最も直接に満たす選択肢にする
- learning point から逸れた周辺知識を正答の中心にしない

【誤答の品質基準】
誤答は、知識が不十分な受験者や典型例に引きずられる受験者が実際に選びうる、
臨床的にもっともらしい選択肢にすること。
一目で除外できる荒唐無稽な誤答は禁止する。

- 誤答は正答と同じ領域・同じ文脈に属していること
- 一見すると正しそうに見えること
- ただし、設問条件を丁寧に読むと誤りと判断できること
- 誤答は、この設問条件のもとで誤りであること
- 別の病期・重症度・患者背景では妥当になりうる内容は許容する
- 重要なのは、本問の条件では選べないことである

【誤答の作り方】
- 誤答は、文全体を露骨に否定して外すのではなく、1か所の判断ポイントだけをずらして作る
- ずらすポイントは、適応、病期、重症度、対象患者、検査の目的、所見の解釈、治療選択、禁忌などのいずれかとする
- それ以外の部分は、できるだけ自然で妥当な記述にする
- 少なくとも1つは上級者でも迷いうる高品質な誤答を含める

【誤答の表現ルール】
- 誤答を不自然に見せる露骨な限定表現は避ける
- 以下のような語を、誤答であることを示すためだけに多用しない：
  「のみ」「必ず」「常に」「全例で」「絶対に」「重要ではない」「不要である」「無意味である」
- 極端な断定で外すのではなく、自然な臨床記述として外す
- 「一部は正しそうだが、この症例・設問条件では誤り」という形を優先する

【誤答の型】
誤答は以下の型から作成すること。
- 典型例の過剰一般化
- 類似疾患との混同
- 病態の取り違え
- 検査適応や所見解釈の誤り
- 治療適応・禁忌・第一選択の取り違え
- 病期や重症度の無視

【避けるべき誤答】
- 露骨な断定で一目で誤りと分かるもの
- 正答だけ具体的で、誤答だけ抽象的なもの
- 「〜のみ」「〜は不要」「〜は重要ではない」など、不自然に正誤を強調したもの
- learning point と無関係な細部でしか正誤が決まらないもの

【自己検証】
出力前に必ず以下を確認すること。
1. 正答が1つのみである
2. 誤答3つがすべて本問の条件では誤りである
3. 正答が learning point を最も直接に問うている
4. 4選択肢の文体・長さ・具体性に不自然な偏りがない
5. 誤答に露骨な否定語・限定語を使っていない
`;

  const userPrompt = `
【論点】
topic: ${lp.topic}
subtopic: ${lp.subtopic ?? "なし"}
title: ${lp.title}

【learning point】
${lp.learningPoint}

【出題意図】
${lp.rationale ?? "未設定"}

【問題難易度】
${difficultyInstruction}

【タスク】
上記の learning point を正答の核として、
神経内科専門医試験演習用の4択単一正答問題を1問作成してください。

追加条件:
- stem は簡潔だが、解答に必要な情報は不足させない
- まず、この設問で正答となる決定的根拠を1つ定め、その根拠を最も直接に問うこと
- 正答は learning point を最も直接に反映するものにする
- 正答以外の3選択肢は、それぞれ別の誤り方で誤っていること
- 誤答は、知識不足、典型例バイアス、類似概念との混同で選ばれうる内容にすること
- 誤答は、露骨な否定語や極端な限定表現で外すのではなく、適応・病期・対象・所見解釈などの1点のズレで誤らせること
- 少なくとも1つは上級者でも迷いうる高品質な誤答を含めること
- explanation では、正答の根拠に加えて、他の3選択肢がなぜ誤りかも簡潔に説明すること
`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
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
            correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] },
            explanation: { type: "string" },
            explanationA: { type: "string" },
            explanationB: { type: "string" },
            explanationC: { type: "string" },
            explanationD: { type: "string" },
          },
          required: ["stem", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanation", "explanationA", "explanationB", "explanationC", "explanationD"],
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;

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

  const auditResult = await auditDraft(draft);
  draft = auditResult.draft;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const promptVersion = "v5-perplexity-lp-no-rag";

  const created = await prisma.questionDraft.create({
    data: {
      learningPointId: lp.id,
      imageAssetId: null,
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
      llmProvider: "openai",
      llmModel: model,
      promptVersion: promptVersion,
      generationMeta: {
        model,
        promptVersion,
        audited: true,
        auditCorrected: auditResult.corrected,
        auditReason: auditResult.auditReason,
        generatedAt: new Date().toISOString(),
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

  return created.id;
}
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
You are an editorial board member responsible for creating questions for the neurology board examination.

Generate high-quality learning point candidates that are suitable for board-style multiple-choice questions.

【General Principles】
- Output must be in English
- Retrieval and knowledge grounding must be based on English sources
- References should prioritize English journal articles, reviews, and clinical guidelines
- Each candidate must focus on exactly one clear concept
- The content must be specific enough to be converted into a 4-option MCQ
- Avoid duplication across candidates
- Avoid overly broad or vague statements
- Do not fabricate or infer uncertain information
- Output must be JSON only

【Difficulty Definition】
CORE:
Essential knowledge every neurologist must know

STANDARD:
Common and frequently tested knowledge

HARD:
Requires integration of multiple concepts or understanding of exceptions

INSANE:
Highly detailed or expert-level knowledge

【Field Definitions】
title:
A concise concept title (12–32 characters)

learningPoint:
Core knowledge forming the correct answer (1–2 sentences)

rationale:
One sentence explaining why this is worth testing

tags:
3–6 short keywords for categorization

【Prohibited】
- General disease overviews
- Epidemiology-only statements
- Ambiguous knowledge
- Concepts not suitable for MCQ
- Duplicate concepts with only subject variation

【Diversity Rule】
Avoid bias across candidates.
Even within the same disease, separate perspectives:
- Pathophysiology
- Clinical features
- Investigation
- Differential diagnosis
- Treatment
- Imaging

Output must be JSON only.
`;

const userPrompt = `
【Input】
topic:
${topic}

subtopic:
${subtopic ?? "not specified"}

keywords:
${normalizedKeywords || "none"}

candidate count:
${safeCount}

【Difficulty Instruction】
${difficultyInstruction}

【Task】
Based on the above, generate ${safeCount} learning point candidates
suitable for neurology board examination questions.

Additional rules:
- Interpret keywords in English
- Each candidate must represent a distinct concept
- Even within the same disease, vary perspectives (pathophysiology, diagnosis, etc.)
- learningPoint must be dense and usable as the core of a question
- rationale must explain how it discriminates examinee understanding
- tags must be concise
- Perform internal deduplication and granularity check before output
- Include 2–3 references if possible
- At least one reference should be an English academic source (journal, review, or guideline)
- Avoid using only non-English websites

【Output format】
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

Output JSON only. Do not include markdown or extra text.
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
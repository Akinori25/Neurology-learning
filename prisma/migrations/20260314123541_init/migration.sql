-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TEXTBOOK', 'GUIDELINE', 'PAPER', 'PAST_EXAM', 'NOTE');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BASIC', 'STANDARD', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionStyle" AS ENUM ('FACT', 'CASE', 'DIFFERENTIAL', 'TREATMENT', 'IMAGE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuestionPublishStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImageModality" AS ENUM ('MRI', 'CT', 'EEG', 'EMG', 'NCS', 'PATHOLOGY', 'MUSCLE_PATHOLOGY', 'CLINICAL_PHOTO', 'FUNDUS', 'PET', 'ULTRASOUND', 'OTHER');

-- CreateEnum
CREATE TYPE "ImageAssetStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SourceType" NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "fileUrl" TEXT,
    "rawText" TEXT,
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceChunk" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chapter" TEXT,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "text" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPoint" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "title" TEXT NOT NULL,
    "learningPoint" TEXT NOT NULL,
    "rationale" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "questionStyle" "QuestionStyle" NOT NULL,
    "tags" TEXT[],
    "sourcePriority" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPointImage" (
    "id" TEXT NOT NULL,
    "learningPointId" TEXT NOT NULL,
    "imageAssetId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPointImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "modality" "ImageModality" NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "diagnosis" TEXT,
    "findings" TEXT,
    "notes" TEXT,
    "sourceLabel" TEXT,
    "sourceYear" INTEGER,
    "copyrightNote" TEXT,
    "status" "ImageAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionDraft" (
    "id" TEXT NOT NULL,
    "learningPointId" TEXT NOT NULL,
    "imageAssetId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stem" TEXT NOT NULL,
    "choiceA" TEXT NOT NULL,
    "choiceB" TEXT NOT NULL,
    "choiceC" TEXT NOT NULL,
    "choiceD" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "explanationA" TEXT,
    "explanationB" TEXT,
    "explanationC" TEXT,
    "explanationD" TEXT,
    "llmModel" TEXT,
    "promptVersion" TEXT,
    "generationMeta" JSONB,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewerComment" TEXT,
    "hasImage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionDraftCitation" (
    "id" TEXT NOT NULL,
    "questionDraftId" TEXT NOT NULL,
    "sourceChunkId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionDraftCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "questionDraftId" TEXT NOT NULL,
    "publishStatus" "QuestionPublishStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'learner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examQuestionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceChunk_sourceId_idx" ON "SourceChunk"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceChunk_sourceId_chunkIndex_key" ON "SourceChunk"("sourceId", "chunkIndex");

-- CreateIndex
CREATE INDEX "LearningPoint_topic_idx" ON "LearningPoint"("topic");

-- CreateIndex
CREATE INDEX "LearningPoint_subtopic_idx" ON "LearningPoint"("subtopic");

-- CreateIndex
CREATE INDEX "LearningPoint_status_idx" ON "LearningPoint"("status");

-- CreateIndex
CREATE INDEX "LearningPointImage_learningPointId_idx" ON "LearningPointImage"("learningPointId");

-- CreateIndex
CREATE INDEX "LearningPointImage_imageAssetId_idx" ON "LearningPointImage"("imageAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPointImage_learningPointId_imageAssetId_key" ON "LearningPointImage"("learningPointId", "imageAssetId");

-- CreateIndex
CREATE INDEX "ImageAsset_topic_idx" ON "ImageAsset"("topic");

-- CreateIndex
CREATE INDEX "ImageAsset_subtopic_idx" ON "ImageAsset"("subtopic");

-- CreateIndex
CREATE INDEX "ImageAsset_modality_idx" ON "ImageAsset"("modality");

-- CreateIndex
CREATE INDEX "ImageAsset_status_idx" ON "ImageAsset"("status");

-- CreateIndex
CREATE INDEX "QuestionDraft_learningPointId_idx" ON "QuestionDraft"("learningPointId");

-- CreateIndex
CREATE INDEX "QuestionDraft_imageAssetId_idx" ON "QuestionDraft"("imageAssetId");

-- CreateIndex
CREATE INDEX "QuestionDraft_status_idx" ON "QuestionDraft"("status");

-- CreateIndex
CREATE INDEX "QuestionDraftCitation_questionDraftId_idx" ON "QuestionDraftCitation"("questionDraftId");

-- CreateIndex
CREATE INDEX "QuestionDraftCitation_sourceChunkId_idx" ON "QuestionDraftCitation"("sourceChunkId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_questionDraftId_key" ON "ExamQuestion"("questionDraftId");

-- CreateIndex
CREATE INDEX "ExamQuestion_publishStatus_idx" ON "ExamQuestion"("publishStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserAttempt_userId_idx" ON "UserAttempt"("userId");

-- CreateIndex
CREATE INDEX "UserAttempt_examQuestionId_idx" ON "UserAttempt"("examQuestionId");

-- CreateIndex
CREATE INDEX "UserAttempt_answeredAt_idx" ON "UserAttempt"("answeredAt");

-- AddForeignKey
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPoint" ADD CONSTRAINT "LearningPoint_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPointImage" ADD CONSTRAINT "LearningPointImage_learningPointId_fkey" FOREIGN KEY ("learningPointId") REFERENCES "LearningPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPointImage" ADD CONSTRAINT "LearningPointImage_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "ImageAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDraft" ADD CONSTRAINT "QuestionDraft_learningPointId_fkey" FOREIGN KEY ("learningPointId") REFERENCES "LearningPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDraft" ADD CONSTRAINT "QuestionDraft_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "ImageAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDraftCitation" ADD CONSTRAINT "QuestionDraftCitation_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDraftCitation" ADD CONSTRAINT "QuestionDraftCitation_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttempt" ADD CONSTRAINT "UserAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttempt" ADD CONSTRAINT "UserAttempt_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

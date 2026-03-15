/*
  Warnings:

  - You are about to drop the column `reviewerComment` on the `LearningPoint` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `LearningPoint` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerComment` on the `QuestionDraft` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `QuestionDraft` table. All the data in the column will be lost.
  - You are about to drop the column `examQuestionId` on the `UserAttempt` table. All the data in the column will be lost.
  - You are about to drop the `ExamQuestion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `origin` to the `LearningPoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionDraftId` to the `UserAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LearningPointOrigin" AS ENUM ('MANUAL', 'LLM', 'SOURCE_LLM');

-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_questionDraftId_fkey";

-- DropForeignKey
ALTER TABLE "UserAttempt" DROP CONSTRAINT "UserAttempt_examQuestionId_fkey";

-- DropIndex
DROP INDEX "LearningPoint_status_idx";

-- DropIndex
DROP INDEX "QuestionDraft_status_idx";

-- DropIndex
DROP INDEX "UserAttempt_examQuestionId_idx";

-- AlterTable
ALTER TABLE "LearningPoint" DROP COLUMN "reviewerComment",
DROP COLUMN "status",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "origin" "LearningPointOrigin" NOT NULL;

-- AlterTable
ALTER TABLE "QuestionDraft" DROP COLUMN "reviewerComment",
DROP COLUMN "status",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserAttempt" DROP COLUMN "examQuestionId",
ADD COLUMN     "questionDraftId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ExamQuestion";

-- DropEnum
DROP TYPE "QuestionPublishStatus";

-- DropEnum
DROP TYPE "ReviewStatus";

-- CreateTable
CREATE TABLE "DraftGood" (
    "id" TEXT NOT NULL,
    "questionDraftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftGood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftRaiseHand" (
    "id" TEXT NOT NULL,
    "questionDraftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftRaiseHand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSetItem" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "questionDraftId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DraftGood_questionDraftId_idx" ON "DraftGood"("questionDraftId");

-- CreateIndex
CREATE INDEX "DraftGood_userId_idx" ON "DraftGood"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftGood_questionDraftId_userId_key" ON "DraftGood"("questionDraftId", "userId");

-- CreateIndex
CREATE INDEX "DraftRaiseHand_questionDraftId_idx" ON "DraftRaiseHand"("questionDraftId");

-- CreateIndex
CREATE INDEX "DraftRaiseHand_userId_idx" ON "DraftRaiseHand"("userId");

-- CreateIndex
CREATE INDEX "DraftRaiseHand_resolved_idx" ON "DraftRaiseHand"("resolved");

-- CreateIndex
CREATE INDEX "QuestionSet_createdById_idx" ON "QuestionSet"("createdById");

-- CreateIndex
CREATE INDEX "QuestionSetItem_questionSetId_idx" ON "QuestionSetItem"("questionSetId");

-- CreateIndex
CREATE INDEX "QuestionSetItem_questionDraftId_idx" ON "QuestionSetItem"("questionDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetItem_questionSetId_questionDraftId_key" ON "QuestionSetItem"("questionSetId", "questionDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetItem_questionSetId_orderIndex_key" ON "QuestionSetItem"("questionSetId", "orderIndex");

-- CreateIndex
CREATE INDEX "LearningPoint_origin_idx" ON "LearningPoint"("origin");

-- CreateIndex
CREATE INDEX "LearningPoint_createdById_idx" ON "LearningPoint"("createdById");

-- CreateIndex
CREATE INDEX "QuestionDraft_createdById_idx" ON "QuestionDraft"("createdById");

-- CreateIndex
CREATE INDEX "QuestionDraft_isPublished_idx" ON "QuestionDraft"("isPublished");

-- CreateIndex
CREATE INDEX "QuestionDraft_publishedAt_idx" ON "QuestionDraft"("publishedAt");

-- CreateIndex
CREATE INDEX "UserAttempt_questionDraftId_idx" ON "UserAttempt"("questionDraftId");

-- AddForeignKey
ALTER TABLE "LearningPoint" ADD CONSTRAINT "LearningPoint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDraft" ADD CONSTRAINT "QuestionDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftGood" ADD CONSTRAINT "DraftGood_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftGood" ADD CONSTRAINT "DraftGood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftRaiseHand" ADD CONSTRAINT "DraftRaiseHand_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftRaiseHand" ADD CONSTRAINT "DraftRaiseHand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetItem" ADD CONSTRAINT "QuestionSetItem_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetItem" ADD CONSTRAINT "QuestionSetItem_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttempt" ADD CONSTRAINT "UserAttempt_questionDraftId_fkey" FOREIGN KEY ("questionDraftId") REFERENCES "QuestionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

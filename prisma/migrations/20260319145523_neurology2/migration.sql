/*
  Warnings:

  - The values [LLM,SOURCE_LLM] on the enum `LearningPointOrigin` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `copyrightNote` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `findings` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `modality` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `sourceLabel` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `sourceYear` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `subtopic` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ImageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `questionStyle` on the `LearningPoint` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `LearningPoint` table. All the data in the column will be lost.
  - You are about to drop the column `sourcePriority` on the `LearningPoint` table. All the data in the column will be lost.
  - You are about to drop the column `hasImage` on the `QuestionDraft` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `LearningPointImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionDraftCitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Source` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SourceChunk` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'LEARNER');

-- AlterEnum
BEGIN;
CREATE TYPE "LearningPointOrigin_new" AS ENUM ('MANUAL', 'PERPLEXITY');
ALTER TABLE "LearningPoint" ALTER COLUMN "origin" TYPE "LearningPointOrigin_new" USING ("origin"::text::"LearningPointOrigin_new");
ALTER TYPE "LearningPointOrigin" RENAME TO "LearningPointOrigin_old";
ALTER TYPE "LearningPointOrigin_new" RENAME TO "LearningPointOrigin";
DROP TYPE "LearningPointOrigin_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ImageAsset" DROP CONSTRAINT "ImageAsset_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "LearningPoint" DROP CONSTRAINT "LearningPoint_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "LearningPointImage" DROP CONSTRAINT "LearningPointImage_imageAssetId_fkey";

-- DropForeignKey
ALTER TABLE "LearningPointImage" DROP CONSTRAINT "LearningPointImage_learningPointId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionDraftCitation" DROP CONSTRAINT "QuestionDraftCitation_questionDraftId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionDraftCitation" DROP CONSTRAINT "QuestionDraftCitation_sourceChunkId_fkey";

-- DropForeignKey
ALTER TABLE "SourceChunk" DROP CONSTRAINT "SourceChunk_sourceId_fkey";

-- DropIndex
DROP INDEX "ImageAsset_modality_idx";

-- DropIndex
DROP INDEX "ImageAsset_status_idx";

-- DropIndex
DROP INDEX "ImageAsset_subtopic_idx";

-- DropIndex
DROP INDEX "ImageAsset_topic_idx";

-- AlterTable
ALTER TABLE "ImageAsset" DROP COLUMN "copyrightNote",
DROP COLUMN "description",
DROP COLUMN "diagnosis",
DROP COLUMN "findings",
DROP COLUMN "modality",
DROP COLUMN "notes",
DROP COLUMN "sourceId",
DROP COLUMN "sourceLabel",
DROP COLUMN "sourceYear",
DROP COLUMN "status",
DROP COLUMN "subtopic",
DROP COLUMN "tags",
DROP COLUMN "title",
DROP COLUMN "topic",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "LearningPoint" DROP COLUMN "questionStyle",
DROP COLUMN "sourceId",
DROP COLUMN "sourcePriority",
ADD COLUMN     "generatedByModel" TEXT,
ADD COLUMN     "generationMeta" JSONB,
ALTER COLUMN "origin" SET DEFAULT 'PERPLEXITY';

-- AlterTable
ALTER TABLE "QuestionDraft" DROP COLUMN "hasImage",
ADD COLUMN     "llmProvider" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'LEARNER';

-- DropTable
DROP TABLE "LearningPointImage";

-- DropTable
DROP TABLE "QuestionDraftCitation";

-- DropTable
DROP TABLE "Source";

-- DropTable
DROP TABLE "SourceChunk";

-- DropEnum
DROP TYPE "ImageAssetStatus";

-- DropEnum
DROP TYPE "ImageModality";

-- DropEnum
DROP TYPE "QuestionStyle";

-- DropEnum
DROP TYPE "SourceStatus";

-- DropEnum
DROP TYPE "SourceType";

-- CreateTable
CREATE TABLE "LearningPointReference" (
    "id" TEXT NOT NULL,
    "learningPointId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPointReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningPointReference_learningPointId_idx" ON "LearningPointReference"("learningPointId");

-- CreateIndex
CREATE INDEX "LearningPointReference_url_idx" ON "LearningPointReference"("url");

-- CreateIndex
CREATE INDEX "LearningPointReference_learningPointId_orderIndex_idx" ON "LearningPointReference"("learningPointId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPointReference_learningPointId_url_key" ON "LearningPointReference"("learningPointId", "url");

-- CreateIndex
CREATE INDEX "ImageAsset_createdAt_idx" ON "ImageAsset"("createdAt");

-- AddForeignKey
ALTER TABLE "LearningPointReference" ADD CONSTRAINT "LearningPointReference_learningPointId_fkey" FOREIGN KEY ("learningPointId") REFERENCES "LearningPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

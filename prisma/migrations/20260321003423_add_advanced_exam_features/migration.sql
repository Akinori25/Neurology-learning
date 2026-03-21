-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "secondsPerQuestion" INTEGER;

-- AlterTable
ALTER TABLE "QuestionDraft" ADD COLUMN     "isAvailableInQuiz" BOOLEAN NOT NULL DEFAULT true;

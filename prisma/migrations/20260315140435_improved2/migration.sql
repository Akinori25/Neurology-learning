-- CreateIndex
CREATE INDEX "LearningPoint_difficulty_idx" ON "LearningPoint"("difficulty");

-- CreateIndex
CREATE INDEX "LearningPoint_updatedAt_idx" ON "LearningPoint"("updatedAt");

-- CreateIndex
CREATE INDEX "LearningPoint_topic_difficulty_idx" ON "LearningPoint"("topic", "difficulty");

-- CreateIndex
CREATE INDEX "QuestionDraft_updatedAt_idx" ON "QuestionDraft"("updatedAt");

-- CreateIndex
CREATE INDEX "QuestionDraft_isPublished_publishedAt_idx" ON "QuestionDraft"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "QuestionDraft_isPublished_learningPointId_idx" ON "QuestionDraft"("isPublished", "learningPointId");

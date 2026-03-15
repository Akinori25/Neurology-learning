import { PrismaClient, Difficulty, QuestionStyle, ReviewStatus, QuestionPublishStatus, SourceType, SourceStatus, ImageModality, ImageAssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 既存データ削除（順番重要）
  await prisma.userAttempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.questionDraftCitation.deleteMany();
  await prisma.questionDraft.deleteMany();
  await prisma.learningPointImage.deleteMany();
  await prisma.learningPoint.deleteMany();
  await prisma.sourceChunk.deleteMany();
  await prisma.imageAsset.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();

  // ----------------------------
  // Users
  // ----------------------------
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
  });

  const learner = await prisma.user.create({
    data: {
      name: 'Test Learner',
      email: 'learner@example.com',
      role: 'learner',
    },
  });

  // ----------------------------
  // Sources
  // ----------------------------
  const cidpGuideline = await prisma.source.create({
    data: {
      title: 'CIDP診療ガイドライン 2024',
      description: 'CIDPの診断・治療に関する要点',
      type: SourceType.GUIDELINE,
      author: 'Neurology Society',
      year: 2024,
      fileUrl: '/sources/cidp_guideline_2024.pdf',
      status: SourceStatus.ACTIVE,
    },
  });

  const msTextbook = await prisma.source.create({
    data: {
      title: '神経内科学テキスト 2025 脱髄疾患章',
      description: '多発性硬化症のMRI所見を含む教科書章',
      type: SourceType.TEXTBOOK,
      author: 'Example Editor',
      year: 2025,
      fileUrl: '/sources/neurology_textbook_2025_ms.pdf',
      status: SourceStatus.ACTIVE,
    },
  });

  // ----------------------------
  // Source Chunks
  // ----------------------------
  const cidpChunk1 = await prisma.sourceChunk.create({
    data: {
      sourceId: cidpGuideline.id,
      chunkIndex: 0,
      chapter: '診断',
      pageStart: 12,
      pageEnd: 12,
      text: 'CIDPでは髄液蛋白上昇を認めることが多いが、著明な細胞数増多は典型的ではない。',
      metadata: {
        section: '診断',
        keywords: ['CIDP', '髄液', '蛋白上昇'],
      },
    },
  });

  const cidpChunk2 = await prisma.sourceChunk.create({
    data: {
      sourceId: cidpGuideline.id,
      chunkIndex: 1,
      chapter: '電気生理',
      pageStart: 14,
      pageEnd: 14,
      text: '神経伝導検査では伝導ブロックや伝導速度低下などの脱髄所見が診断上重要である。',
      metadata: {
        section: '電気生理',
        keywords: ['CIDP', '伝導ブロック', 'NCS'],
      },
    },
  });

  const msChunk1 = await prisma.sourceChunk.create({
    data: {
      sourceId: msTextbook.id,
      chunkIndex: 0,
      chapter: '多発性硬化症',
      pageStart: 88,
      pageEnd: 88,
      text: '多発性硬化症ではMRIで側脳室周囲に卵円形のT2/FLAIR高信号病変を認め、Dawson’s fingersを示唆する所見がみられる。',
      metadata: {
        section: '画像所見',
        keywords: ['MS', 'MRI', 'Dawsons fingers'],
      },
    },
  });

  // ----------------------------
  // Image Assets
  // ----------------------------
  const msMriImage = await prisma.imageAsset.create({
    data: {
      sourceId: msTextbook.id,
      title: 'MS brain MRI 01',
      description: '多発性硬化症に典型的な側脳室周囲病変の例',
      fileUrl: '/images/ms/ms_brain_mri_01.jpg',
      thumbnailUrl: '/images/ms/thumbnails/ms_brain_mri_01.jpg',
      modality: ImageModality.MRI,
      topic: '脱髄疾患',
      subtopic: '多発性硬化症',
      diagnosis: 'Multiple sclerosis',
      findings: 'FLAIRで側脳室周囲に複数の卵円形高信号病変を認め、Dawson’s fingersを示唆する。',
      notes: '教育用に使用する代表画像',
      sourceLabel: '神経内科学テキスト 2025 図5-2',
      sourceYear: 2025,
      copyrightNote: '教育用途のみ',
      status: ImageAssetStatus.ACTIVE,
      tags: ['MS', 'MRI', 'Demyelinating disease'],
    },
  });

  const cidpNcsImage = await prisma.imageAsset.create({
    data: {
      title: 'CIDP nerve conduction study 01',
      description: 'CIDPでの伝導ブロック例',
      fileUrl: '/images/cidp/cidp_ncs_01.png',
      thumbnailUrl: '/images/cidp/thumbnails/cidp_ncs_01.png',
      modality: ImageModality.NCS,
      topic: '末梢神経',
      subtopic: 'CIDP',
      diagnosis: 'CIDP',
      findings: '運動神経伝導検査で伝導ブロックを示唆する振幅低下を認める。',
      notes: '伝導ブロック説明用',
      sourceLabel: '自作教育画像',
      sourceYear: 2026,
      copyrightNote: '院内教育用途',
      status: ImageAssetStatus.ACTIVE,
      tags: ['CIDP', 'NCS', 'Conduction block'],
    },
  });

  // ----------------------------
  // Learning Points
  // ----------------------------
  const lpCidpCsf = await prisma.learningPoint.create({
    data: {
      sourceId: cidpGuideline.id,
      topic: '末梢神経',
      subtopic: 'CIDP',
      title: 'CIDPの髄液所見',
      learningPoint: 'CIDPでは典型的に髄液蛋白上昇を認めるが、著明な細胞数増多は通常伴わない。',
      rationale: 'CIDPの典型的検査所見の理解は専門医試験で重要。',
      difficulty: Difficulty.STANDARD,
      questionStyle: QuestionStyle.FACT,
      tags: ['CIDP', 'CSF', '髄液'],
      sourcePriority: 10,
      status: ReviewStatus.APPROVED,
    },
  });

  const lpCidpNcs = await prisma.learningPoint.create({
    data: {
      sourceId: cidpGuideline.id,
      topic: '末梢神経',
      subtopic: 'CIDP',
      title: 'CIDPの神経伝導検査所見',
      learningPoint: 'CIDPでは神経伝導検査で伝導ブロックなどの脱髄所見が診断上有用である。',
      rationale: 'CIDP診断の中心となる所見であり、症例問題にも展開しやすい。',
      difficulty: Difficulty.STANDARD,
      questionStyle: QuestionStyle.IMAGE,
      tags: ['CIDP', 'NCS', '伝導ブロック'],
      sourcePriority: 10,
      status: ReviewStatus.APPROVED,
    },
  });

  const lpMsMri = await prisma.learningPoint.create({
    data: {
      sourceId: msTextbook.id,
      topic: '脱髄疾患',
      subtopic: '多発性硬化症',
      title: 'MSの典型的MRI所見',
      learningPoint: '多発性硬化症では側脳室周囲に卵円形病変を認め、Dawson’s fingersを示唆する所見がみられる。',
      rationale: '画像問題として出題しやすい代表論点。',
      difficulty: Difficulty.STANDARD,
      questionStyle: QuestionStyle.IMAGE,
      tags: ['MS', 'MRI', 'Dawsons fingers'],
      sourcePriority: 8,
      status: ReviewStatus.APPROVED,
    },
  });

  // ----------------------------
  // LearningPoint ↔ Image links
  // ----------------------------
  await prisma.learningPointImage.createMany({
    data: [
      {
        learningPointId: lpCidpNcs.id,
        imageAssetId: cidpNcsImage.id,
        note: 'CIDPのNCS画像候補',
      },
      {
        learningPointId: lpMsMri.id,
        imageAssetId: msMriImage.id,
        note: 'MSのMRI画像候補',
      },
    ],
  });

  // ----------------------------
  // Question Drafts
  // ----------------------------
  const draftCidpCsf = await prisma.questionDraft.create({
    data: {
      learningPointId: lpCidpCsf.id,
      version: 1,
      stem: 'CIDPで典型的にみられる髄液所見として最も適切なのはどれか。',
      choiceA: '蛋白上昇を認めるが、著明な細胞数増多は通常伴わない',
      choiceB: '高度の好中球増多を認める',
      choiceC: '糖低下が必発である',
      choiceD: '髄液所見は常に正常である',
      correctAnswer: 'A',
      explanation: 'CIDPでは蛋白細胞解離に近い所見、すなわち蛋白上昇と細胞数増多を伴わない所見が典型的である。',
      explanationA: '正しい。CIDPの典型的髄液所見である。',
      explanationB: '誤り。好中球優位の細胞増多はCIDPに典型的ではない。',
      explanationC: '誤り。糖低下は典型所見ではない。',
      explanationD: '誤り。正常のこともあるが、典型的とはいえない。',
      llmModel: 'manual-seed',
      promptVersion: 'seed-v1',
      generationMeta: {
        source: 'manual',
      },
      status: ReviewStatus.APPROVED,
      reviewerComment: '公開可',
      hasImage: false,
    },
  });

  const draftCidpNcs = await prisma.questionDraft.create({
    data: {
      learningPointId: lpCidpNcs.id,
      imageAssetId: cidpNcsImage.id,
      version: 1,
      stem: 'この神経伝導検査所見に基づき、CIDPの診断を支持する所見として最も適切なのはどれか。',
      choiceA: '伝導ブロック',
      choiceB: 'waning',
      choiceC: '低頻度反復刺激でdecrementのみを認めること',
      choiceD: '感覚神経活動電位の完全正常化のみ',
      correctAnswer: 'A',
      explanation: 'CIDPでは神経伝導検査で伝導ブロックなどの脱髄所見が診断上重要である。',
      explanationA: '正しい。CIDPを支持する代表的脱髄所見である。',
      explanationB: '誤り。waningは典型的表現ではない。',
      explanationC: '誤り。これは神経筋接合部疾患を想起しやすい。',
      explanationD: '誤り。これのみではCIDP支持所見とはいえない。',
      llmModel: 'manual-seed',
      promptVersion: 'seed-v1',
      generationMeta: {
        source: 'manual',
        imageDriven: true,
      },
      status: ReviewStatus.APPROVED,
      reviewerComment: '画像問題として公開可',
      hasImage: true,
    },
  });

  const draftMsMri = await prisma.questionDraft.create({
    data: {
      learningPointId: lpMsMri.id,
      imageAssetId: msMriImage.id,
      version: 1,
      stem: 'この脳MRI所見として最も考えやすいものはどれか。',
      choiceA: 'Dawson’s fingersを示唆する側脳室周囲病変',
      choiceB: '被殻優位の慢性出血性変化',
      choiceC: '橋中心髄鞘崩壊症に特異的な所見',
      choiceD: '脳表ヘモジデリン沈着',
      correctAnswer: 'A',
      explanation: '多発性硬化症では側脳室周囲の卵円形病変がみられ、Dawson’s fingersを示唆することがある。',
      explanationA: '正しい。MSの代表的MRI所見である。',
      explanationB: '誤り。MSの典型所見ではない。',
      explanationC: '誤り。病変分布が異なる。',
      explanationD: '誤り。表在性鉄沈着症を想起する。',
      llmModel: 'manual-seed',
      promptVersion: 'seed-v1',
      generationMeta: {
        source: 'manual',
        imageDriven: true,
      },
      status: ReviewStatus.DRAFT,
      reviewerComment: '選択肢表現を少し調整したい',
      hasImage: true,
    },
  });

  // ----------------------------
  // Draft Citations
  // ----------------------------
  await prisma.questionDraftCitation.createMany({
    data: [
      {
        questionDraftId: draftCidpCsf.id,
        sourceChunkId: cidpChunk1.id,
        note: '髄液所見の根拠',
      },
      {
        questionDraftId: draftCidpNcs.id,
        sourceChunkId: cidpChunk2.id,
        note: 'NCS所見の根拠',
      },
      {
        questionDraftId: draftMsMri.id,
        sourceChunkId: msChunk1.id,
        note: 'MRI所見の根拠',
      },
    ],
  });

  // ----------------------------
  // Published Questions
  // ----------------------------
  const examCidpCsf = await prisma.examQuestion.create({
    data: {
      questionDraftId: draftCidpCsf.id,
      publishStatus: QuestionPublishStatus.ACTIVE,
    },
  });

  const examCidpNcs = await prisma.examQuestion.create({
    data: {
      questionDraftId: draftCidpNcs.id,
      publishStatus: QuestionPublishStatus.ACTIVE,
    },
  });

  // ----------------------------
  // User Attempts
  // ----------------------------
  await prisma.userAttempt.createMany({
    data: [
      {
        userId: learner.id,
        examQuestionId: examCidpCsf.id,
        selectedAnswer: 'A',
        isCorrect: true,
      },
      {
        userId: learner.id,
        examQuestionId: examCidpNcs.id,
        selectedAnswer: 'C',
        isCorrect: false,
      },
    ],
  });

  console.log('✅ Seed completed');
  console.log({
    adminId: admin.id,
    learnerId: learner.id,
    sources: [cidpGuideline.title, msTextbook.title],
    images: [msMriImage.title, cidpNcsImage.title],
    learningPoints: [lpCidpCsf.title, lpCidpNcs.title, lpMsMri.title],
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
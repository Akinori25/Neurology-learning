import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ManageExamItemsClient from "./ManageExamItemsClient";

export default async function ExamDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
        include: { draft: { include: { learningPoint: true } } },
      },
    },
  });

  if (!exam) notFound();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            ステータス: {exam.isPublished ? "公開中" : "非公開"}
          </p>
        </div>
        <Link
          href="/admin/exam"
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          一覧へ戻る
        </Link>
      </div>

      <ManageExamItemsClient exam={exam} items={exam.items} />
    </main>
  );
}

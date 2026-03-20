import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ManageSetItemsClient from "./ManageSetItemsClient";

export default async function QuestionSetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const set = await prisma.questionSet.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
        include: { draft: { include: { learningPoint: true } } },
      },
    },
  });

  if (!set) notFound();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{set.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            ステータス: {set.isPublished ? "公開中" : "非公開"}
          </p>
        </div>
        <Link
          href="/admin/question-sets"
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          一覧へ戻る
        </Link>
      </div>

      <ManageSetItemsClient setId={set.id} items={set.items} isPublished={set.isPublished} />
    </main>
  );
}

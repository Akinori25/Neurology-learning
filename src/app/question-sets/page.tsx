import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function QuestionSetsPage() {
  const sets = await prisma.questionSet.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">問題集</h1>
          <p className="mt-2 text-sm text-gray-500">
            テーマごとにまとめられた問題セットを解くことができます
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          ホームへ戻る
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sets.map((set) => (
          <div
            key={set.id}
            className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="font-semibold text-lg text-slate-900">{set.title}</h2>
              {set.description && (
                <p className="mt-2 text-sm text-slate-500">{set.description}</p>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                収録問題数: {set._count.items}問
              </span>
              
              <Link
                href={`/quiz?setId=${set.id}`}
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                解く
              </Link>
            </div>
          </div>
        ))}

        {sets.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500">
            現在、公開されている問題集はありません。
          </div>
        )}
      </div>
    </main>
  );
}

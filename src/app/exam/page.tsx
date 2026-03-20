import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ExamsPage() {
  const exams = await prisma.exam.findMany({
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
          <h1 className="text-2xl font-bold text-emerald-800">模擬試験</h1>
          <p className="mt-2 text-sm text-gray-500">
            本番さながらの1問10秒の制限時間で力試しができます
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
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="font-semibold text-lg text-slate-900">{exam.title}</h2>
              {exam.description && (
                <p className="mt-2 text-sm text-slate-500">{exam.description}</p>
              )}
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>問題数: {exam._count.items}問</span>
                <span>
                  推定平均: {exam.predictedMeanScore ? exam.predictedMeanScore.toFixed(1) : "-"}
                </span>
                <span>
                  合格ライン: {exam.passDeviationThreshold ? `偏差値${exam.passDeviationThreshold}` : "-"}
                </span>
              </div>
              
              <Link
                href={`/exam/${exam.id}`}
                className="text-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 block"
              >
                受験を開始する
              </Link>
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500">
            現在、公開されている模擬試験はありません。
          </div>
        )}
      </div>
    </main>
  );
}

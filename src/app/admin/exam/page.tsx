import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function createExam(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  if (!title) return;
  await prisma.exam.create({
    data: { title },
  });
  revalidatePath("/admin/exam");
}

export default async function AdminExamPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, attempts: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">模擬試験の管理</h1>
        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          管理メニューへ戻る
        </Link>
      </div>

      <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">新規作成</h2>
        <form action={createExam} className="flex gap-4">
          <input
            name="title"
            placeholder="模擬試験のタイトル"
            required
            className="flex-1 rounded-xl border px-4 py-2 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-6 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            作成
          </button>
        </form>
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-5 py-4 font-semibold text-slate-900">タイトル</th>
                <th className="px-5 py-4 font-semibold text-slate-900">ステータス</th>
                <th className="px-5 py-4 font-semibold text-slate-900">問題数</th>
                <th className="px-5 py-4 font-semibold text-slate-900">予想平均</th>
                <th className="px-5 py-4 font-semibold text-slate-900 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exams.map((set) => (
                <tr key={set.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {set.title}
                  </td>
                  <td className="px-5 py-4">
                    {set.isPublished ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">公開</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">非公開</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {set._count.items}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {set.predictedMeanScore ? set.predictedMeanScore.toFixed(1) : "-"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/exam/${set.id}`}
                      className="text-sky-600 hover:text-sky-800 font-medium"
                    >
                      詳細・編集
                    </Link>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    模擬試験がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

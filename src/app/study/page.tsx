import Navbar from "@/components/Navbar";
import { FileText, Clock, Target } from "lucide-react";

const subjects = [
  { label: "数学一", value: "math1", description: "适用专业：理工科" },
  { label: "数学二", value: "math2", description: "适用专业：工科" },
  { label: "数学三", value: "math3", description: "适用专业：经济管理" },
];

const recentTopics = [
  { name: "极限与连续", count: 42, accuracy: 78 },
  { name: "导数与微分", count: 56, accuracy: 65 },
  { name: "不定积分", count: 38, accuracy: 82 },
  { name: "定积分", count: 31, accuracy: 71 },
  { name: "多元函数微分法", count: 24, accuracy: 58 },
];

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">学习中心</h1>

        {/* Subject selection */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">选择科目</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {subjects.map((s) => (
              <button
                key={s.value}
                className="rounded-xl border-2 border-transparent bg-white p-5 text-left shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
              >
                <p className="text-lg font-bold text-gray-900">{s.label}</p>
                <p className="mt-1 text-sm text-gray-500">{s.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">快速开始</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl bg-blue-600 p-5 text-white shadow">
              <FileText className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">真题模式</p>
                <p className="text-sm opacity-80">按年份刷真题</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-emerald-600 p-5 text-white shadow">
              <Target className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">专题练习</p>
                <p className="text-sm opacity-80">按知识点突破</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-amber-500 p-5 text-white shadow">
              <Clock className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">错题复习</p>
                <p className="text-sm opacity-80">巩固薄弱环节</p>
              </div>
            </div>
          </div>
        </section>

        {/* Topics */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">知识点概览</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">知识点</th>
                  <th className="px-6 py-3 text-right font-medium">已练题数</th>
                  <th className="px-6 py-3 text-right font-medium">正确率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTopics.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{t.count} 题</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          t.accuracy >= 75 ? "text-emerald-600" : "text-amber-500"
                        }`}
                      >
                        {t.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

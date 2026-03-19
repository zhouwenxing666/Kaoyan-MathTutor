import Link from "next/link";
import Navbar from "@/components/Navbar";
import { BookOpen, BarChart2, MessageCircle, FileText } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "真题练习",
    description: "收录1987年至今历年考研数学真题，按年份、题型、知识点分类练习",
  },
  {
    icon: BarChart2,
    title: "错题分析",
    description: "自动记录错题，智能分析薄弱知识点，生成个性化复习计划",
  },
  {
    icon: MessageCircle,
    title: "AI 辅导",
    description: "基于大模型的智能辅导系统，随时解答疑问，提供详细解题思路",
  },
  {
    icon: BookOpen,
    title: "知识体系",
    description: "系统梳理数学一、二、三核心考点，构建完整知识体系",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            考研数学，<span className="text-blue-600">高效备考</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            真题练习 · 错题追踪 · AI 辅导 · 数据分析，全方位助你考研数学高分
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/study"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              开始学习
            </Link>
            <Link
              href="/profile"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              我的中心
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">平台功能</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

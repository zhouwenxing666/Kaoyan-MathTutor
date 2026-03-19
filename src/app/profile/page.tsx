import Navbar from "@/components/Navbar";
import { User, BookOpen, CheckCircle, TrendingUp } from "lucide-react";

const stats = [
  { label: "累计练题", value: "346", icon: BookOpen },
  { label: "正确率", value: "72%", icon: CheckCircle },
  { label: "连续打卡", value: "12天", icon: TrendingUp },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">个人中心</h1>

        {/* User info */}
        <div className="mb-6 flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">考研同学</p>
            <p className="text-sm text-gray-500">目标：2026 考研数学一</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-white p-5 shadow-sm text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-blue-50 p-3">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Settings placeholder */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">账号设置</h2>
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex justify-between border-b pb-3">
              <span>目标科目</span>
              <span className="font-medium text-gray-700">数学一</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span>每日目标题数</span>
              <span className="font-medium text-gray-700">20 题</span>
            </div>
            <div className="flex justify-between">
              <span>通知提醒</span>
              <span className="font-medium text-gray-700">已开启</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, GraduationCap, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <GraduationCap className="h-6 w-6" />
            <span>考研数学平台</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/study"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              学习中心
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <User className="h-4 w-4" />
              个人中心
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

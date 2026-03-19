#!/bin/bash
# Kaoyan-MathTutor 数据库初始化脚本

set -e

cd ~/Documents/Projects/Kaoyan-MathTutor

echo "=== 1. 检查登录状态 ==="
npx supabase status

echo ""
echo "=== 2. 链接项目（如果未链接）==="
npx supabase link --project-ref pwkxeedjvnglcxcxlyxk

echo ""
echo "=== 3. 推送数据库迁移 ==="
# 使用 db push 命令将本地 SQL 推送到远程
npx supabase db push --db-url "postgresql://postgres:6t5nFRrNPvnG75jz@db.pwkxeedjvnglcxcxlyxk.supabase.co:5432/postgres"

echo ""
echo "=== 4. 验证数据库 ==="
npx supabase db query "SELECT subject, COUNT(*) as count FROM chapters GROUP BY subject;"

echo ""
echo "=== 完成！==="

#!/bin/bash
# Bấm đúp file này để chạy website Nội Thất IRIS (bản Node.js) trên máy Mac.
# Website mở ở http://localhost:3000  –  Quản trị: http://localhost:3000/quan-tri/
# Muốn tắt: đóng cửa sổ Terminal này (hoặc bấm Ctrl + C).
cd "$(dirname "$0")"
export PATH="$HOME/.node22/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Chưa có Node.js. Cài Node.js 22 tại https://nodejs.org rồi chạy lại."
  read -r -p "Bấm Enter để đóng…"
  exit 1
fi
[ -f .env ] || cp .env.example .env
if [ ! -x node_modules/.bin/prisma ] || [ ! -x node_modules/.bin/next ]; then
  rm -rf node_modules
  npm install || { read -r -p "Lỗi khi cài thư viện. Bấm Enter để đóng…"; exit 1; }
fi
if [ -f prisma/noithat.db ]; then npm run db:push >/dev/null || { read -r -p "Lỗi cập nhật cơ sở dữ liệu. Bấm Enter để đóng…"; exit 1; }; else npm run setup; fi
echo ""
echo "Website: http://localhost:3000   |   Quản trị: http://localhost:3000/quan-tri/"
echo "Đóng cửa sổ này để tắt website."
(sleep 5; open "http://localhost:3000") &
npm run dev

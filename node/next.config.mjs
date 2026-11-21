import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Đường dẫn giống bản WordPress (có dấu / ở cuối).
  trailingSlash: true,
  // Thư mục dự án (tránh Next.js nhầm sang thư mục cha khi máy có nhiều dự án).
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
};
export default nextConfig;

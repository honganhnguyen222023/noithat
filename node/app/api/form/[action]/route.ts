import { NextResponse } from 'next/server';
import { ACTIONS } from '@/lib/actions';

// Nhận form của khách (/api/form/<tên>/), xử lý rồi chuyển trang.
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host && origin !== process.env.SITE_URL) return new Response('Yêu cầu không hợp lệ.', { status: 403 });
  const fn = ACTIONS[(await params).action];
  if (!fn) return new Response('Không tìm thấy.', { status: 404 });
  return NextResponse.redirect(new URL(await fn(await req.formData()), site), 303);
}

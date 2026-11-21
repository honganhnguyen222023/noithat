import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';

export async function GET(req: Request) {
  await endSession('admin');
  return NextResponse.redirect(new URL('/quan-tri/dang-nhap/?da-dang-xuat=1', process.env.SITE_URL || req.url), 303);
}

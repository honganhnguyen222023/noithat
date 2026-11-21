import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';

export async function GET(req: Request) {
  await endSession();
  return NextResponse.redirect(new URL('/', process.env.SITE_URL || req.url), 303);
}

import { NextResponse, type NextRequest } from 'next/server';

// Ghi đường dẫn đang mở vào header "x-path" để đầu trang biết tô đậm mục menu nào.
export function middleware(req: NextRequest) {
  const h = new Headers(req.headers);
  h.set('x-path', req.nextUrl.pathname);
  h.set('x-search', req.nextUrl.searchParams.get('s') || '');
  return NextResponse.next({ request: { headers: h } });
}

export const config = { matcher: ['/((?!_next|css|js|fonts|uploads|favicon|api).*)'] };

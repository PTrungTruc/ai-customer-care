// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// export async function middleware(request: NextRequest) {
//   const token = await getToken({ req: request });
//   // const token = {role: "ADMIN"};

//   const isAuthPage = request.nextUrl.pathname.startsWith('/login');
//   const isProtectedPage = request.nextUrl.pathname.startsWith('/chat') ||
//     request.nextUrl.pathname.startsWith('/admin') ||
//     request.nextUrl.pathname.startsWith('/staff');

//   if (isAuthPage) {
//     if (token) {
//       return NextResponse.redirect(new URL('/chat', request.url));
//     }
//     return NextResponse.next();
//   }

//   if (isProtectedPage && !token) {
//     return NextResponse.redirect(new URL('/login', request.url));
//   }

//   if (request.nextUrl.pathname.startsWith('/admin')) {
//     if (token?.role !== 'ADMIN') {
//       return NextResponse.redirect(new URL('/chat', request.url));
//     }
//   }

//   if (request.nextUrl.pathname.startsWith('/staff')) {
//     if (token?.role !== 'STAFF' && token?.role !== 'ADMIN') {
//       return NextResponse.redirect(new URL('/chat', request.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/login', '/chat/:path*', '/admin/:path*', '/staff/:path*'],
// };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  let user = null;

  // ✅ 1️⃣ Kiểm tra custom auth-token
  const customToken = request.cookies.get('auth-token')?.value;

  if (customToken) {
    try {
      // user = JSON.parse(customToken);
      // const { payload } = await jwtVerify(JSON.parse(customToken), secret);
      // user = payload;
    } catch (err) {
      console.log(err);
    }
  }

  // ✅ 2️⃣ Nếu chưa có user → kiểm tra next-auth
  if (!user) {
    const nextAuthToken = await getToken({ req: request });
    if (nextAuthToken) {
      user = nextAuthToken;
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage =
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/staff');

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  if (isProtectedPage && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith('/staff')) {
    if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/chat/:path*', '/admin/:path*', '/staff/:path*', '/embed_chat/:path*'],
};
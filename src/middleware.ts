import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) =>
      SESSION_COOKIE_PREFIXES.some(
        (prefix) =>
          cookie.name === prefix || cookie.name.startsWith(`${prefix}.`),
      ),
    );
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/sessions") ||
    pathname.startsWith("/profile")
  );
}

/**
 * Cookie-only gate. OpenNext does not support Next.js 16 Node proxy.ts yet,
 * so this stays on the Edge middleware convention. Session validity is
 * enforced with `requireAuth()` in protected server layouts.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = hasSessionCookie(request);

  if (isProtectedRoute(pathname) && !session) {
    const redirectUrl = new URL("/login", request.url);
    if (pathname !== redirectUrl.pathname) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthRoute(pathname) && session) {
    const redirectUrl = new URL("/chat", request.url);
    if (pathname !== redirectUrl.pathname) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$|api/).*)",
  ],
};

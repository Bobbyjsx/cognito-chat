import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

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

const protectedRoutes = [
  "/chat",
  "/chat/",
  "/settings",
  "/library",
  "/sessions",
  "/profile",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route));
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$|api/).*)",
  ],
};

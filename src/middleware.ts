import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const session = request.auth;
  const { pathname } = request.nextUrl;

  const isChatRoute =
    pathname === "/chat" || pathname.startsWith("/chat/");
  const isProtectedRoute =
    pathname === "/" ||
    isChatRoute ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/sessions") ||
    pathname.startsWith("/profile");

  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url);
    if (pathname !== redirectUrl.pathname) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthRoute && session) {
    const redirectUrl = new URL("/chat", request.url);
    if (pathname !== redirectUrl.pathname) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/|api/).*)"],
};

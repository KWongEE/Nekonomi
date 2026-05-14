import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths through without auth
  const publicPaths = ["/login", "/api/auth"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!isPublic && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  // Protect all routes except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};

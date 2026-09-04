import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routes } from "@/config/routes";

const PUBLIC_PAGES = new Set<string>([
  routes.home,
  routes.login,
  routes.forgotPassword,
  routes.setPassword,
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicApi = pathname === "/api/keepalive";
  const isPublicPage = PUBLIC_PAGES.has(pathname);

  const token = await getToken({ req });

  if (!isApi && isPublicPage && token && pathname !== routes.home) {
    return NextResponse.redirect(new URL(routes.dashboard, req.url));
  }

  if (isApi && !isAuthApi && !isPublicApi) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isApi && !isPublicPage) {
    if (!token) {
      return NextResponse.redirect(new URL(routes.login, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

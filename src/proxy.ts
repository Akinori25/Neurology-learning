import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

const protectedAdminRoutes = ["/admin"];
const protectedUserRoutes = ["/quiz", "/question-sets", "/exam"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = protectedAdminRoutes.some((route) =>
    path.startsWith(route)
  );
  const isUserRoute = protectedUserRoutes.some((route) =>
    path.startsWith(route)
  );

  if (!isAdminRoute && !isUserRoute) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && session.role !== "ADMIN" && session.role !== "EDITOR") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  const host = hostname.split(":")[0];

  const parts = host.split(".");

  // Example:
  // royal.yourdomain.com
  // parts = ["royal", "yourdomain", "com"]

  if (parts.length >= 3) {
    const subdomain = parts[0];

    const url = request.nextUrl.clone();

    url.pathname = `/store/${subdomain}${url.pathname}`;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

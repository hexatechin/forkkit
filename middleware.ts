import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const host = hostname.split(":")[0];

  const baseDomain = "indocia.in";

  // sunrisecafe.indocia.in
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.replace(`.${baseDomain}`, "");

    // Ignore www
    if (subdomain && subdomain !== "www") {
      const url = request.nextUrl.clone();

      // Internally rewrite:
      // sunrisecafe.indocia.in
      //          ↓
      // /t/sunrisecafe
      url.pathname = `/t/${subdomain}${url.pathname}`;

      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

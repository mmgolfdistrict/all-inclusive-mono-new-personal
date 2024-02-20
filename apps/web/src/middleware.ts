import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// const isPage = (
//   path: string,
//   req: NextRequest,
//   options: { exactMatch: boolean } = { exactMatch: false }
// ) => {
//   return options.exactMatch
//     ? req.nextUrl.pathname === path
//     : req.nextUrl.pathname.includes(path);
// };

// This function can be marked `async` if using `await` inside
export function middleware(_request: NextRequest) {
  // const currentURL = request.nextUrl.href;
  // const isSecureCookie = currentURL.startsWith("https://");
  // const jwToken = request.cookies.get(
  //   isSecureCookie
  //     ? "__Secure-next-auth.session-token"
  //     : "next-auth.session-token"
  // );

  // if (!jwToken && isPage("/account-settings", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (!jwToken && isPage("/checkout", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/forgot-password", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/reset-password", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/login", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/register", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/verify", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // if (jwToken && isPage("/verify-email", request)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_ROLES, type AuthRole } from "@/types/database.types";

const ADMIN_ROUTES = ["/admin"];
const CLIENT_ROUTES = ["/dashboard"];
const ADMIN_API_ROUTES = ["/api/admin", "/api/events"];
const CLIENT_API_ROUTES = ["/api/dashboard", "/api/guests", "/api/checkin"];
const SHARED_CHECKIN_API_ROUTES = ["/api/guests/check-in"];
const SHARED_UPLOAD_API_ROUTES = ["/api/uploads"];
const SHARED_CHECKIN_ROLES: AuthRole[] = [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT];
const PUBLIC_ROUTES = ["/", "/login", "/admin/login", "/builder", "/favicon.ico", "/logo.svg"];
const PUBLIC_PREFIXES = ["/_next", "/invitation", "/carte", "/api/auth"];
const PUBLIC_INVITATION_API_ROUTES = ["/api/public/events"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname) || startsWithAny(pathname, PUBLIC_PREFIXES);
}

function jsonDenied(status: 401 | 403, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function redirectToLogin(request: NextRequest, loginPath: "/login" | "/admin/login") {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: "Trop de requetes. Veuillez patienter quelques instants." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

function rateLimitResponse(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/rsvp") {
    const result = checkRateLimit(request, { key: "api:rsvp", limit: 5, windowMs: 60_000 });
    if (result.limited) return tooManyRequests(result.retryAfterSeconds);
  }

  if (pathname === "/api/auth/login") {
    const result = checkRateLimit(request, { key: "api:auth-login", limit: 5, windowMs: 15 * 60_000 });
    if (result.limited) return tooManyRequests(result.retryAfterSeconds);
  }

  if (startsWithAny(pathname, ["/invitation", ...PUBLIC_INVITATION_API_ROUTES])) {
    const result = checkRateLimit(request, { key: "public:invitation", limit: 150, windowMs: 60_000 });
    if (result.limited) return tooManyRequests(result.retryAfterSeconds);
  }

  return null;
}

function roleAllowed(role: string | undefined, expected: AuthRole) {
  return role === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limitedResponse = rateLimitResponse(request);
  if (limitedResponse) return limitedResponse;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (startsWithAny(pathname, ADMIN_API_ROUTES)) {
    if (!session) return jsonDenied(401, "Authentification admin requise.");
    if (!roleAllowed(session.role, AUTH_ROLES.SUPER_ADMIN)) return jsonDenied(403, "Acces admin refuse.");
    return NextResponse.next();
  }

  if (startsWithAny(pathname, [...SHARED_CHECKIN_API_ROUTES, ...SHARED_UPLOAD_API_ROUTES])) {
    if (!session) return jsonDenied(401, "Authentification requise.");
    if (!SHARED_CHECKIN_ROLES.includes(session.role as AuthRole)) {
      return jsonDenied(403, "Acces refuse.");
    }
    return NextResponse.next();
  }

  if (startsWithAny(pathname, CLIENT_API_ROUTES)) {
    if (!session) return jsonDenied(401, "Authentification client requise.");
    if (!roleAllowed(session.role, AUTH_ROLES.CLIENT)) return jsonDenied(403, "Acces client refuse.");
    return NextResponse.next();
  }

  if (startsWithAny(pathname, ADMIN_ROUTES)) {
    if (!session || !roleAllowed(session.role, AUTH_ROLES.SUPER_ADMIN)) {
      return redirectToLogin(request, "/admin/login");
    }
  }

  if (startsWithAny(pathname, CLIENT_ROUTES)) {
    if (!session || !roleAllowed(session.role, AUTH_ROLES.CLIENT)) {
      return redirectToLogin(request, "/login");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};

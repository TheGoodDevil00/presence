import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Always allow /auth/callback through — it needs to exchange the code for a session
  // before any session check can succeed
  if (url.pathname === "/auth/callback") {
    return NextResponse.next();
  }

  // Refresh the Supabase session on every request
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Protect /silence, /onboarding, /invite/* — redirect to /auth if no session
  const isProtectedRoute =
    url.pathname === "/silence" ||
    url.pathname === "/onboarding" ||
    url.pathname.startsWith("/invite/");

  if (isProtectedRoute && !user) {
    url.searchParams.set("next", url.pathname);
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from /auth to /silence (or /onboarding if no profile/pair)
  if (url.pathname === "/auth" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    const { data: pair } = await supabase
      .from("pairs")
      .select("id")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .maybeSingle();

    url.pathname = pair ? "/silence" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sounds/|icons/|manifest.json|workbox-|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

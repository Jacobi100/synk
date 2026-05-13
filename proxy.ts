import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "./lib/supabase/client";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/api/webhooks/clerk",
  "/api/webhooks/squad(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (userId && !isPublicRoute(req) && !isApiRoute(req)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("clerk_id", userId)
      .single();

    if (!profile || !profile.onboarding_complete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

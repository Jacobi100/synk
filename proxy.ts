import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from './lib/supabase/client'

const isPublicRoute = createRouteMatcher([
  "/api/webhooks/clerk",
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',  // onboarding must be public, or you'll get a redirect loop
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // 1. Not logged in → send to sign-in
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // 2. Logged in but on a protected route → check onboarding
  if (userId && !isPublicRoute(req)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('clerk_id', userId)
      .single()

    // Profile doesn't exist yet (webhook might be delayed) or onboarding incomplete
    if (!profile || !profile.onboarding_complete) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
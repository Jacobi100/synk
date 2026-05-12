// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from './lib/supabase/client'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  "/api/webhooks/clerk",
  '/sign-up(.*)',
  '/onboarding(.*)',
])

const isApiRoute = createRouteMatcher(['/api/(.*)']) // ← add this

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (userId && !isPublicRoute(req) && !isApiRoute(req)) { // ← skip API routes
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('clerk_id', userId)
      .single()

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
# Synk

> Post a job. Get help nearby. Money stays safe until the work is done.

Synk is an intelligent bounty marketplace that connects people who need work done with skilled professionals in their area. Built for the **Squad Hackathon 3.0** — *Smart Systems: The Intelligent Economy*.

It solves a real problem: millions of informal workers and small businesses in Nigeria operate outside formal economic systems. There's no trust layer. No payment safety net. No way to verify who you're hiring. Synk changes that with AI-powered trust scoring, escrow payments via Squad, and location-based job matching.

---

## How It Works

```
Client posts a job (bounty) with location, budget, and description
        │
        ▼
Nearby providers discover the job via map or feed
        │
        ▼
Provider applies → Client reviews applicant profile + trust score
        │
        ▼
Client accepts → Squad creates a virtual account (escrow)
        │
        ▼
Client pays into escrow → Provider is notified and gets contact info
        │
        ▼
Work happens in the real world
        │
        ▼
Client marks complete → Payment released to provider via Squad Transfer API
        │
        ▼
Both users rate each other → Reputation system updates
```

**Dispute protection:** Auto-release after 48 hours if client doesn't respond. Dispute button available to providers after 24 hours.

---

## Key Features

- **Location-based job discovery** — Google Maps integration with custom purple markers showing nearby jobs. Works on mobile and desktop.
- **AI trust scoring** — Gemini-powered reputation analysis using behavioral signals, transaction history, and profile completeness. Not traditional credit scores.
- **Escrow payments via Squad** — Virtual accounts created per bounty. Money is held safely until work is verified complete.
- **Fraud detection** — AI-powered anomaly detection on transactions and applications.
- **Price intelligence** — AI suggests fair market prices based on category, location, and historical data.
- **Real-time notifications** — Application updates, payment confirmations, and completion alerts.
- **Clerk authentication** — Secure sign-in/sign-up with social providers.

---

## Squad API Integration

Squad is the core payment engine. Every financial transaction flows through it.

| Integration Point | Squad API Used | Purpose |
|---|---|---|
| Escrow on job acceptance | Virtual Account Creation | Holds client payment securely |
| Payment confirmation | Webhook (`/api/webhooks/squad`) | Confirms funds received, triggers service start |
| Payment release | Transfer API | Sends funds to provider on job completion |
| Checkout flow | Initiate Payment (Checkout) | Client-facing payment experience |

Without Squad, there is no Synk. Payments are not a feature — they are the foundation.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Payments:** Squad API (sandbox → production)
- **AI:** Google Gemini 2.5 Flash (structured output via Zod schemas)
- **Maps:** Google Maps JavaScript API (Advanced Markers)
- **Styling:** Tailwind CSS 4, custom design system
- **Motion:** Framer Motion
- **Language:** TypeScript

---

## Project Structure

```
app/
  (auth)/                 # Clerk sign-in/sign-up pages
  api/
    ai/                   # AI endpoints (fraud, reputation, price suggestion, search)
    bounties/             # Full bounty CRUD + application workflow
    notifications/        # User notification management
    webhooks/squad/       # Squad payment webhook handler
    wallet/               # User wallet balance
    profile/              # User profile management
  bounties/               # Bounty listing, detail, creation, payment pages
  dashboard/              # User dashboard with stats
  wallet/                 # Wallet page
  profile/                # Profile page

components/
  BountyCard.tsx          # Bounty listing card
  BountyForm.tsx          # Create/edit bounty form
  Navbar.tsx              # Navigation bar
  map/
    NearbyJobsMap.tsx     # Google Maps with job markers
    NavigationMap.tsx     # Turn-by-turn directions
  unlumen-ui/             # Custom UI primitives (badges, skeletons, animated counters)

lib/
  gemini.ts               # Gemini AI client with typed structured output
  squad.ts                # Squad API client (checkout, virtual accounts, webhooks)
  trust/                  # Trust score calculator
  risk/                   # Risk scoring engine with rules
  bounty/                 # Bounty business logic
  notifications.ts        # Notification creation and management
  copy.ts                 # All user-facing strings (single source of truth)

supabase/
  migrations/             # Database schema migrations
  seed.sql                # Seed data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A [Squad](https://dashboard.squadco.com) merchant account (sandbox keys work)
- A [Google Cloud](https://console.cloud.google.com) project with Maps JavaScript API enabled
- A [Google AI](https://aistudio.google.com) API key for Gemini

### Setup

```bash
git clone https://github.com/davidxml/synk.git
cd synk
npm install
```

Create a `.env.local` file:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Squad Payments
SQUAD_SECRET_KEY=your_squad_secret_key
SQUAD_API_BASE_URL=https://sandbox-api-d.squadco.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Gemini AI
GEMINI_API_KEY=your_gemini_key
```

Run database migrations:

```bash
npm run db:migrate
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

### Bounties

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bounties` | ✓ | Create a bounty |
| GET | `/api/bounties` | ✗ | List bounties (filter by category, status, location) |
| GET | `/api/bounties/[id]` | ✗ | Get bounty details |
| PATCH | `/api/bounties/[id]` | ✓ | Update bounty (poster only) |
| DELETE | `/api/bounties/[id]` | ✓ | Delete bounty (poster only) |

### Applications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bounties/apply` | ✓ | Apply to a bounty |
| GET | `/api/bounties/[id]/applications` | ✓ | List applications (poster only) |
| POST | `.../applications/[appId]/accept` | ✓ | Accept applicant → creates escrow |
| POST | `.../applications/[appId]/reject` | ✓ | Reject applicant |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/squad` | Squad | Payment confirmation webhook |
| POST | `/api/bounties/[id]/mark-complete` | ✓ | Release payment to provider |
| POST | `/api/bounties/[id]/initiate-payment` | ✓ | Start Squad checkout |

### AI Intelligence

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/reputation` | Generate trust score for a user |
| POST | `/api/ai/fraud` | Detect suspicious transaction patterns |
| POST | `/api/ai/suggest-price` | AI price recommendation |
| POST | `/api/ai/search` | Semantic search across bounties |
| POST | `/api/ai/complete-description` | AI-assisted bounty description |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✓ | Get user notifications |
| PATCH | `/api/notifications` | ✓ | Mark as read |
| DELETE | `/api/notifications` | ✓ | Delete notification |

---

## Database Schema

Core tables (see `supabase/migrations/` for full schema):

- **profiles** — User profiles with location, skills, and trust metadata
- **bounties** — Job listings with location, budget, status, and urgency
- **bounty_applications** — Provider applications to bounties
- **squad_virtual_accounts** — Escrow accounts per bounty
- **payment_records** — Transaction history tied to Squad references
- **notifications** — In-app notification feed
- **reviews** — Post-completion ratings between users

---

## The Four Pillars (Squad Hackathon 3.0)

This solution addresses all four hackathon innovation pillars:

**AI Automation** — Trust scoring, fraud detection, and price suggestion are fully automated via Gemini. No manual review needed for standard cases.

**Use of Data** — Behavioral signals, transaction patterns, application history, and location data feed into real-time risk and reputation models. Alternative data replaces traditional credit scores.

**Squad APIs** — Payments are the backbone. Virtual accounts hold escrow. Webhooks confirm transactions. Transfer API releases funds. Every bounty touchpoint involves Squad.

**Financial Innovation** — Escrow-based trust for informal workers who have never had access to formal financial protection. Reputation that follows you across jobs. A marketplace that makes it safe to hire someone you've never met.

---

## License

MIT

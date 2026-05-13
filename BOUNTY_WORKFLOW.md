# Bounty Application Workflow Documentation

## Overview

This document describes the complete bounty application and payment workflow implemented in the Synk API.

## Workflow Flowchart

```
POSTER creates bounty
        │
        ▼
PROVIDER sees bounty within radius → clicks "Apply"
        │
        ▼
System checks:
  - Provider profile complete?
  - Provider not the poster?
  - Bounty still open?
        │
        ├── NO → block + show reason
        │
        ▼
Application created in DB (status: pending)
Poster gets notified ("Someone applied to your bounty")
        │
        ▼
POSTER reviews applicant profile
        │
        ├── Reject → application status: rejected, notify provider
        │
        ▼
POSTER clicks "Accept" on a provider
        │
        ▼
System:
  1. Creates a Squad Virtual Account for this bounty
  2. Locks bounty (status: in_progress, no more applications)
  3. Notifies poster: "Pay to confirm booking"
        │
        ▼
POSTER pays into the Virtual Account (escrow)
Squad webhook fires → payment confirmed
        │
        ▼
System:
  - Bounty status: paid / awaiting_service
  - Provider notified: "Payment confirmed, proceed with service"
  - Provider gets poster's phone number (now safe to call)
        │
        ▼
SERVICE HAPPENS (phone call, physical work, delivery etc.)
        │
        ▼
POSTER clicks "Mark as Complete"
        │
        ├── Confirms work is done
        │
        ▼
System releases payment:
  - Squad Transfer API → sends to provider's account
  - Bounty status: completed
  - Both users can now rate each other
        │
        ▼
DISPUTE PATH (if poster never marks complete):
  - Auto-release after 48hrs if no dispute raised
  - Dispute button available to provider after 24hrs
```

## API Endpoints

### Bounty Management

#### Create a Bounty

- **Method:** `POST`
- **URL:** `/api/bounties`
- **Auth:** Required (Clerk)
- **Request Body:**
  ```json
  {
    "title": "Fix leaky faucet",
    "description": "Kitchen faucet is leaking",
    "category": "plumbing",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "location_name": "Ikoyi, Lagos",
    "radius_km": 5,
    "price_min": 5000,
    "price_max": 10000,
    "currency": "NGN",
    "price_negotiable": true,
    "urgency": "asap",
    "slots_available": 1
  }
  ```
- **Response:** Returns created `Bounty` object with status `201`

#### Get All Bounties

- **Method:** `GET`
- **URL:** `/api/bounties`
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `status` (optional): Filter by status (open, in_progress, completed, cancelled)
  - `urgency` (optional): Filter by urgency
  - `search` (optional): Search in title, description, location
  - `limit` (optional, default: 10): Number of results
  - `offset` (optional, default: 0): Pagination offset
- **Response:** Returns array of `Bounty` objects

#### Get Bounty by ID

- **Method:** `GET`
- **URL:** `/api/bounties/[id]`
- **Response:** Returns single `Bounty` object

#### Update Bounty

- **Method:** `PATCH`
- **URL:** `/api/bounties/[id]`
- **Auth:** Required (must be poster)
- **Request Body:** Any subset of bounty fields
- **Response:** Returns updated `Bounty` object

#### Delete Bounty

- **Method:** `DELETE`
- **URL:** `/api/bounties/[id]`
- **Auth:** Required (must be poster)
- **Response:** Returns 204 on success

#### Get User's Bounties

- **Method:** `GET`
- **URL:** `/api/bounties/my-bounties`
- **Auth:** Required (Clerk)
- **Response:** Returns array of `Bounty` objects created by authenticated user

### Application Management

#### Apply to a Bounty

- **Method:** `POST`
- **URL:** `/api/bounties/apply`
- **Auth:** Required (Clerk)
- **Request Body:**
  ```json
  {
    "bountyId": "uuid"
  }
  ```
- **Validation:**
  - Provider profile must exist and be complete
  - Provider cannot be the poster
  - Bounty must have status "open"
  - Provider cannot have already applied
- **On Success:**
  - Application created with status "pending"
  - Poster receives notification
- **Response:** Returns `BountyApplication` object with status `201`

#### Get Applications for a Bounty

- **Method:** `GET`
- **URL:** `/api/bounties/[id]/applications`
- **Auth:** Required (must be poster)
- **Response:** Returns array of `BountyApplication` objects

#### Accept an Application

- **Method:** `POST`
- **URL:** `/api/bounties/[id]/applications/[appId]/accept`
- **Auth:** Required (must be poster)
- **Side Effects:**
  - Creates Squad Virtual Account
  - Sets bounty status to "in_progress"
  - Rejects all other pending applications
  - Notifies poster and provider
- **Response:** Returns acceptance confirmation with application and bounty details

#### Reject an Application

- **Method:** `POST`
- **URL:** `/api/bounties/[id]/applications/[appId]/reject`
- **Auth:** Required (must be poster)
- **Request Body:**
  ```json
  {
    "reason": "Optional rejection reason"
  }
  ```
- **Side Effects:**
  - Updates application status to "rejected"
  - Notifies provider with reason (if provided)
- **Response:** Returns updated `BountyApplication` object

#### Get Provider's Applications

- **Method:** `GET`
- **URL:** `/api/applications`
- **Auth:** Required (Clerk)
- **Query Parameters:**
  - `status` (optional): Filter by status (pending, accepted, rejected, completed)
- **Response:** Returns array of `BountyApplication` objects

### Payment & Squad Management

#### Squad Payment Webhook

- **Method:** `POST`
- **URL:** `/api/webhooks/squad`
- **Auth:** Squad webhook signature verification
- **Payload (from Squad):**
  ```json
  {
    "reference": "squad_reference_id",
    "status": "success|failed"
  }
  ```
- **On Success:**
  - Updates payment record status to "confirmed"
  - Updates Squad account status to "paid"
  - Updates bounty status to "awaiting_service"
  - Notifies both poster and provider
- **Response:** Returns confirmation

#### Mark Bounty as Complete

- **Method:** `POST`
- **URL:** `/api/bounties/[id]/mark-complete`
- **Auth:** Required (must be poster)
- **Validation:**
  - Bounty must have status "awaiting_service"
- **Side Effects:**
  - Updates bounty status to "completed"
  - Updates Squad account status to "released"
  - Triggers payment transfer to provider (Squad Transfer API)
  - Enables rating for both users
  - Notifies both users
- **Response:** Returns confirmation with updated bounty

### Notifications

#### Get User Notifications

- **Method:** `GET`
- **URL:** `/api/notifications`
- **Auth:** Required (Clerk)
- **Query Parameters:**
  - `unread` (optional, default: false): Only unread notifications
- **Response:** Returns array of `Notification` objects

#### Mark Notification as Read

- **Method:** `PATCH`
- **URL:** `/api/notifications`
- **Auth:** Required (Clerk)
- **Request Body:**
  ```json
  {
    "action": "mark_read",
    "notificationId": "uuid"
  }
  ```
- **Response:** Returns updated `Notification` object

#### Mark All Notifications as Read

- **Method:** `PATCH`
- **URL:** `/api/notifications`
- **Auth:** Required (Clerk)
- **Request Body:**
  ```json
  {
    "action": "mark_all_read"
  }
  ```
- **Response:** Returns confirmation

#### Delete Notification

- **Method:** `DELETE`
- **URL:** `/api/notifications`
- **Auth:** Required (Clerk)
- **Request Body:**
  ```json
  {
    "notificationId": "uuid"
  }
  ```
- **Response:** Returns confirmation

## Data Models

### Bounty

```typescript
{
  id: string;
  poster_id: string;
  title: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  radius_km: number;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  price_negotiable: boolean;
  images: string[] | null;
  deadline: string | null;
  urgency: 'asap' | 'scheduled' | 'flexible';
  slots_available: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  squad_account_id: string | null;
  selected_provider_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### BountyApplication

```typescript
{
  id: string;
  bounty_id: string;
  provider_id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
```

### SquadVirtualAccount

```typescript
{
  id: string;
  bounty_id: string;
  squad_account_id: string;
  provider_id: string;
  amount: number;
  status: "pending" | "paid" | "released" | "disputed";
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### PaymentRecord

```typescript
{
  id: string;
  bounty_id: string;
  squad_account_id: string;
  squad_reference: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  updated_at: string;
}
```

### Notification

```typescript
{
  id: string;
  user_id: string;
  type: "application_received" |
    "application_accepted" |
    "application_rejected" |
    "payment_confirmed" |
    "service_started" |
    "bounty_completed" |
    "payment_released" |
    "rating_available";
  title: string;
  message: string;
  bounty_id: string | null;
  application_id: string | null;
  related_user_id: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}
```

## Database Schema Requirements

You'll need to create the following tables in Supabase:

### bounty_applications

```sql
CREATE TABLE bounty_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bounty_id, provider_id)
);

CREATE INDEX idx_applications_bounty ON bounty_applications(bounty_id);
CREATE INDEX idx_applications_provider ON bounty_applications(provider_id);
```

### squad_virtual_accounts

```sql
CREATE TABLE squad_virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  squad_account_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'released', 'disputed')) DEFAULT 'pending',
  payment_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bounty_id)
);

CREATE INDEX idx_squad_bounty ON squad_virtual_accounts(bounty_id);
```

### payment_records

```sql
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  squad_account_id UUID NOT NULL REFERENCES squad_virtual_accounts(id) ON DELETE CASCADE,
  squad_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_reference ON payment_records(squad_reference);
CREATE INDEX idx_payment_bounty ON payment_records(bounty_id);
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  application_id UUID REFERENCES bounty_applications(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
```

### Update bounties table

```sql
ALTER TABLE bounties ADD COLUMN squad_account_id TEXT;
ALTER TABLE bounties ADD COLUMN selected_provider_id UUID REFERENCES profiles(id);
```

## Implementation TODOs

The following features need to be completed:

1. **Squad API Integration**
   - Implement actual virtual account creation via Squad API
   - Implement payment webhook signature verification
   - Implement payment transfer to provider's account

2. **Notifications**
   - Add email/SMS sending for critical notifications
   - Implement real-time notifications (WebSocket or polling)
   - Add notification preferences UI

3. **Dispute Handling**
   - Implement 48-hour auto-release for unpaid bounties
   - Implement dispute creation endpoint
   - Implement dispute resolution workflow

4. **Rating System**
   - Create rating endpoints
   - Implement rating aggregation and display
   - Calculate provider reputation scores

5. **Admin Dashboard**
   - Monitor all bounties and applications
   - Handle disputes and escalations
   - View payment flows and reconciliation

6. **Frontend Integration**
   - Update components to call these endpoints
   - Add real-time status updates
   - Improve UX based on workflow

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success (GET, PATCH, POST update)
- `201` - Created (POST create)
- `204` - No content (DELETE)
- `400` - Bad request (validation errors)
- `401` - Unauthorized (missing auth)
- `403` - Forbidden (permission denied)
- `404` - Not found
- `500` - Internal server error

## Testing

To test the workflow:

1. Create a bounty as User A (poster)
2. Apply to the bounty as User B (provider)
3. Accept the application as User A
4. Simulate payment with Squad webhook
5. Mark complete as User A
6. Verify all status changes and notifications

## Future Enhancements

- Multi-provider acceptance (accept multiple applications if slots_available > 1)
- Bidding/negotiation system
- Advanced search with geolocation filtering
- Provider verification and background checks
- Insurance/protection for bounties
- Bulk bounty creation
- API rate limiting and quota management

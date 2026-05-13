# API Endpoints Summary

This file provides a quick reference for all implemented endpoints in the bounty workflow system.

## Endpoint Quick Reference

### Bounty Endpoints

| Method | Endpoint                    | Purpose                        | Auth |
| ------ | --------------------------- | ------------------------------ | ---- |
| POST   | `/api/bounties`             | Create a new bounty            | ✓    |
| GET    | `/api/bounties`             | List all bounties with filters | ✗    |
| GET    | `/api/bounties/[id]`        | Get specific bounty            | ✗    |
| PATCH  | `/api/bounties/[id]`        | Update bounty (poster only)    | ✓    |
| DELETE | `/api/bounties/[id]`        | Delete bounty (poster only)    | ✓    |
| GET    | `/api/bounties/my-bounties` | Get user's created bounties    | ✓    |

### Application Endpoints

| Method | Endpoint                                         | Purpose                                    | Auth |
| ------ | ------------------------------------------------ | ------------------------------------------ | ---- |
| POST   | `/api/bounties/apply`                            | Apply to a bounty                          | ✓    |
| GET    | `/api/bounties/[id]/applications`                | List applications for bounty (poster only) | ✓    |
| POST   | `/api/bounties/[id]/applications/[appId]/accept` | Accept application (poster only)           | ✓    |
| POST   | `/api/bounties/[id]/applications/[appId]/reject` | Reject application (poster only)           | ✓    |
| GET    | `/api/applications`                              | Get provider's applications                | ✓    |

### Payment & Service Endpoints

| Method | Endpoint                           | Purpose                               | Auth  |
| ------ | ---------------------------------- | ------------------------------------- | ----- |
| POST   | `/api/webhooks/squad`              | Squad payment confirmation webhook    | Squad |
| POST   | `/api/bounties/[id]/mark-complete` | Mark bounty as complete (poster only) | ✓     |

### Notification Endpoints

| Method | Endpoint             | Purpose                    | Auth |
| ------ | -------------------- | -------------------------- | ---- |
| GET    | `/api/notifications` | Get user's notifications   | ✓    |
| PATCH  | `/api/notifications` | Mark notifications as read | ✓    |
| DELETE | `/api/notifications` | Delete notification        | ✓    |

## Created Files

### Backend Code

- `/app/api/bounties/apply/route.ts` - Provider applies to bounty
- `/app/api/bounties/[id]/applications/route.ts` - List applications for a bounty
- `/app/api/bounties/[id]/applications/[appId]/accept/route.ts` - Accept application
- `/app/api/bounties/[id]/applications/[appId]/reject/route.ts` - Reject application
- `/app/api/applications/route.ts` - Get provider's applications
- `/app/api/bounties/[id]/mark-complete/route.ts` - Mark bounty as complete
- `/app/api/webhooks/squad/route.ts` - Squad payment webhook handler
- `/app/api/notifications/route.ts` - Notification management

### Library Code

- `/lib/types/bounty.ts` - Updated with new types (BountyApplication, ProviderProfile, SquadVirtualAccount, PaymentRecord, Notification)
- `/lib/bounty.ts` - Added application management functions
- `/lib/notifications.ts` - Notification creation and management

### Documentation

- `/BOUNTY_WORKFLOW.md` - Complete workflow documentation with flowchart
- `/database-migrations.sql` - SQL migration file for all new tables
- `/API_ENDPOINTS.md` - This file

## Key Database Tables Created

1. **bounty_applications** - Track provider applications to bounties
2. **squad_virtual_accounts** - Track Squad virtual accounts per bounty
3. **payment_records** - Track payment transactions
4. **notifications** - Track user notifications

## Key Database Columns Added to Existing Tables

1. **bounties**
   - `squad_account_id` (TEXT) - Reference to Squad virtual account
   - `selected_provider_id` (UUID) - Reference to selected provider

## Workflow State Transitions

### Bounty Status

```
open → in_progress (when application accepted)
→ awaiting_service (when payment confirmed)
→ completed (when marked complete)
```

### Application Status

```
pending → accepted or rejected
```

### Squad Account Status

```
pending → paid (when payment confirmed)
→ released (when service marked complete)
```

## Notification Types

- `application_received` - When someone applies to your bounty
- `application_accepted` - When your application is accepted
- `application_rejected` - When your application is rejected
- `payment_confirmed` - When payment is confirmed
- `service_started` - When service begins
- `bounty_completed` - When service is marked complete
- `payment_released` - When payment is released to provider
- `rating_available` - When users can rate each other

## Authentication

All endpoints marked with ✓ require Clerk authentication:

- Extract user ID from Clerk auth context
- Convert Clerk ID to profile UUID via `getProfileUUID()`
- Use profile UUID for all database queries

## Error Codes

- `400` - Validation errors (incomplete profile, already applied, bounty not open, etc.)
- `401` - Missing or invalid authentication
- `403` - Permission denied (not poster, not provider, etc.)
- `404` - Resource not found
- `500` - Server error

## Testing Scenarios

### Full Workflow Test

1. User A creates bounty
2. User B applies to bounty
3. User A accepts User B's application
4. System creates Squad virtual account
5. Simulate Squad webhook with successful payment
6. User A marks bounty as complete
7. Verify all status changes and notifications

### Error Scenarios

- Apply to own bounty → 400
- Apply with incomplete profile → 403
- Apply to closed bounty → 400
- Apply twice → 400
- Reject/accept without being poster → 403
- Complete without being poster → 403
- Complete bounty not in awaiting_service → 400

## Integration Points

### Clerk Integration

- Authentication for all protected endpoints
- User ID extraction via `auth()`

### Supabase Integration

- All CRUD operations via supabase-js client and server clients
- Row-level security policies should be configured

### Squad Integration

- Virtual account creation (to be implemented)
- Payment confirmation webhook
- Payment transfer API (to be implemented)

## Future Enhancements Checklist

- [ ] Implement Squad API virtual account creation
- [ ] Implement Squad webhook signature verification
- [ ] Implement Squad payment transfer API
- [ ] Add real-time notifications (WebSocket)
- [ ] Add email/SMS notifications
- [ ] Implement dispute resolution workflow
- [ ] Implement 48-hour auto-release
- [ ] Add rating system endpoints
- [ ] Add provider verification system
- [ ] Add admin dashboard endpoints
- [ ] Add multi-provider support
- [ ] Add bidding/negotiation system

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(bounty_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_bounty ON applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_applications_provider ON applications(provider_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Transactions table for escrow payments
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  squad_virtual_account_ref TEXT,
  squad_transaction_ref TEXT,
  squad_transfer_ref TEXT,
  
  amount NUMERIC(12, 2) NOT NULL,
  platform_fee NUMERIC(12, 2),
  provider_payout NUMERIC(12, 2),
  
  status TEXT CHECK (status IN ('awaiting_payment', 'paid', 'released', 'disputed', 'refunded')) DEFAULT 'awaiting_payment',
  
  paid_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_bounty ON transactions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_transactions_va_ref ON transactions(squad_virtual_account_ref);

-- Update bounty status check constraint
DO $$
BEGIN
  ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'in_progress', 'paid', 'completed', 'cancelled'));

-- Notifications Table (Create if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'application_received',
    'application_accepted',
    'application_rejected',
    'payment_confirmed',
    'service_complete',
    'payout_sent'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

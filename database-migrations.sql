-- Bounty Applications Table
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
CREATE INDEX idx_applications_status ON bounty_applications(status);

-- Squad Virtual Accounts Table
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
CREATE INDEX idx_squad_provider ON squad_virtual_accounts(provider_id);

-- Payment Records Table
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
CREATE INDEX idx_payment_status ON payment_records(status);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'application_received',
    'application_accepted',
    'application_rejected',
    'payment_confirmed',
    'service_started',
    'bounty_completed',
    'payment_released',
    'rating_available'
  )),
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
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Add columns to bounties table if they don't exist
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS squad_account_id TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS selected_provider_id UUID REFERENCES profiles(id);

-- Update bounty status check constraint if needed
-- This assumes your current bounty status check allows these values
-- ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
-- ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
--   CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'awaiting_service'));

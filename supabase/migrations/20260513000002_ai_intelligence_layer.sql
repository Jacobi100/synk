-- Add trust badge columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trust_badge TEXT 
  CHECK (trust_badge IN ('new', 'active', 'trusted', 'community_trusted')) 
  DEFAULT 'new',
ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trust_signals JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trust_computed_at TIMESTAMP WITH TIME ZONE;

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  final_score INTEGER NOT NULL,
  recommendation TEXT 
    CHECK (recommendation IN ('approve', 'hold', 'block')) NOT NULL,
  layer1_score INTEGER,
  gemini_contribution INTEGER,
  risk_factors JSONB,
  signals JSONB,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE 
    DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_transaction 
  ON fraud_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_bounty 
  ON fraud_alerts(bounty_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_provider 
  ON fraud_alerts(provider_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_recommendation 
  ON fraud_alerts(recommendation);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created 
  ON fraud_alerts(created_at DESC);
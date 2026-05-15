-- Add a proposed_price column to the applications table for negotiated offers
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS proposed_price NUMERIC(12, 2);

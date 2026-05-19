-- Add scheduling configuration columns to locations table
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS generation_interval_days INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS posting_days_of_week     INT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS posting_hour             INT DEFAULT 9;

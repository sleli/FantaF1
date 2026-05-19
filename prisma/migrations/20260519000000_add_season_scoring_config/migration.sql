-- Idempotent DB update for projects that have historically used prisma db push.
ALTER TABLE IF EXISTS "predictions"
  ADD COLUMN IF NOT EXISTS "multiplier" DOUBLE PRECISION DEFAULT 1.0;

ALTER TABLE IF EXISTS "seasons"
  ADD COLUMN IF NOT EXISTS "scoringConfig" JSONB;

-- Fix for failed Prisma migration P3009
-- Run this in your Supabase SQL Editor

-- Step 1: Check current migration status
SELECT * FROM "_prisma_migrations"
WHERE migration_name = '20260106000000_add_missing_schema'
ORDER BY started_at DESC;

-- Step 2: Mark the failed migration as rolled back
UPDATE "_prisma_migrations"
SET finished_at = started_at,
    applied_steps_count = 0,
    logs = 'Manually marked as rolled back to resolve deployment'
WHERE migration_name = '20260106000000_add_missing_schema'
  AND finished_at IS NULL;

-- Step 3: Verify the update
SELECT migration_name, started_at, finished_at, applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name = '20260106000000_add_missing_schema';

-- After running this, redeploy your application
-- Prisma will attempt to apply the migration again

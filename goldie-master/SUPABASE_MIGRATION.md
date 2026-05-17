# Supabase Migration Instructions

## Add wallet_address and ens_name Columns to Scores Table

To enable Web3 wallet connection and ENS support for leaderboard submissions, run the following SQL in your Supabase SQL Editor:

```sql
-- Add wallet_address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scores' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE scores ADD COLUMN wallet_address TEXT;
  END IF;
END $$;

-- Add ens_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scores' AND column_name = 'ens_name'
  ) THEN
    ALTER TABLE scores ADD COLUMN ens_name TEXT;
  END IF;
END $$;

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_wallet_address ON scores(wallet_address);

-- Create index on ens_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_ens_name ON scores(ens_name);
```

### Steps to Run Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL above
6. Click "Run" to execute the migration

### Verification

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scores';
```

You should see both `wallet_address` and `ens_name` in the list of columns.

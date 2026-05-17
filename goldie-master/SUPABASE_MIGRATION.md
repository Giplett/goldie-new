# Supabase Migration Instructions

## Add ens_name Column to Scores Table

To enable ENS support for leaderboard submissions, run the following SQL in your Supabase SQL Editor:

```sql
-- Add ens_name column to scores table
ALTER TABLE scores ADD COLUMN ens_name TEXT;

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

After running the migration, verify the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scores';
```

You should see `ens_name` in the list of columns.

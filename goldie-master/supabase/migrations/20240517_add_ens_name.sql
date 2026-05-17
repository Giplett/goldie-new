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

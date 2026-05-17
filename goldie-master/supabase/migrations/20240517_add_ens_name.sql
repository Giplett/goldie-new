-- Add wallet_address and ens_name columns to scores table
ALTER TABLE scores ADD COLUMN wallet_address TEXT;
ALTER TABLE scores ADD COLUMN ens_name TEXT;

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_wallet_address ON scores(wallet_address);

-- Create index on ens_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_ens_name ON scores(ens_name);

# Leaderboard Setup for Goldie Game

## Prerequisites

- Supabase account (free tier works)
- Vercel account for deployment

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Name: `goldie-leaderboard`
   - Database Password: (generate a strong password and save it)
   - Region: Choose closest to your users
5. Wait for project to be created (2-3 minutes)

## Step 2: Create Database Table

Go to the Supabase dashboard > SQL Editor > New Query and run:

```sql
-- Create scores table
CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  score INTEGER NOT NULL,
  game_duration_ms INTEGER NOT NULL,
  pipe_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read scores
CREATE POLICY "Allow public read access"
  ON scores FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert scores
CREATE POLICY "Allow public insert"
  ON scores FOR INSERT
  WITH CHECK (true);

-- Create function to keep only top 10 scores
CREATE OR REPLACE FUNCTION cleanup_old_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE id NOT IN (
    SELECT id FROM scores
    ORDER BY score DESC, created_at ASC
    LIMIT 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up after insert
CREATE TRIGGER cleanup_scores_trigger
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_scores();
```

## Step 3: Get API Keys

1. Go to Project Settings > API
2. Copy:
   - `project_url` (e.g., https://xyz.supabase.co)
   - `anon public key` (starts with `eyJ...`)

## Step 4: Set Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_public_key
```

### Vercel Deployment

Add these in Vercel dashboard under Environment Variables:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Also add:
- `SUPABASE_URL` (same value as REACT_APP_SUPABASE_URL)
- `SUPABASE_ANON_KEY` (same value as REACT_APP_SUPABASE_ANON_KEY)

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Features Implemented

- ✅ Store leaderboard data in Supabase
- ✅ Vercel-compatible API routes for score submission and fetching
- ✅ Top 10 scores only (automatic cleanup)
- ✅ Username input after game over if score qualifies
- ✅ Spam prevention (rate limiting: 5 requests/minute)
- ✅ Username sanitization (removes HTML tags, special chars)
- ✅ Scores sorted highest to lowest
- ✅ Leaderboard displayed inside game UI
- ✅ Mobile responsive design
- ✅ Environment variables for Supabase keys
- ✅ Server-side score validation (duration, pipe count, timing)
- ✅ Animated leaderboard display
- ✅ Conditional username input for top 10 qualifiers

## Score Validation

The API validates scores server-side to prevent cheating:
- Game duration must be between 1 second and 1 hour
- Average time per pipe must be reasonable (1-10 seconds)
- Score must equal pipe count (each pipe = 1 point)
- Scores over 1000 are rejected as impossible

## Security

- Row Level Security (RLS) enabled on Supabase table
- Rate limiting prevents spam submissions
- Input sanitization removes malicious content
- Server-side validation prevents fake scores

## API Routes

- `POST /api/submit-score` - Submit a score with validation
- `GET /api/get-leaderboard` - Fetch top 10 scores

## Troubleshooting

### Leaderboard Not Working

1. Verify `.env.local` has correct values
2. Check Supabase project is active
3. Ensure RLS policies are set correctly
4. Verify API routes are deployed on Vercel

### Build Errors

If you encounter ESLint errors, ensure all dependencies are installed:
```bash
npm install
```

### Supabase Connection Errors

1. Check your Supabase project is active
2. Verify API keys are correct
3. Ensure the scores table exists
4. Check browser console for specific error messages

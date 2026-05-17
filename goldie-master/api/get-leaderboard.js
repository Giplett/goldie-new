const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch top 10 scores
    const { data, error } = await supabase
      .from('scores')
      .select('username, score, created_at')
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true }) // Tiebreaker: earlier scores first
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    // Format the response
    const leaderboard = data.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      date: entry.created_at
    }));

    return res.status(200).json({ 
      success: true, 
      leaderboard: leaderboard 
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

// Score validation constants
const MIN_GAME_DURATION_MS = 1000; // Minimum 1 second
const MAX_GAME_DURATION_MS = 3600000; // Maximum 1 hour
const MIN_PIPE_TIME_MS = 1000; // Minimum 1 second per pipe
const MAX_PIPE_TIME_MS = 10000; // Maximum 10 seconds per pipe

// Sanitize username
function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') return null;
  
  // Remove any HTML tags, special characters, and trim
  const sanitized = username
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
    .trim()
    .substring(0, 20); // Max 20 characters
  
  if (sanitized.length < 1) return null;
  return sanitized;
}

// Validate score progression
function validateScoreProgression(score, gameDurationMs, pipeCount) {
  // Check if all required fields are present
  if (typeof score !== 'number' || typeof gameDurationMs !== 'number' || typeof pipeCount !== 'number') {
    return { valid: false, reason: 'Invalid data types' };
  }

  // Check score equals pipe count (each pipe passed = 1 point)
  if (score !== pipeCount) {
    return { valid: false, reason: 'Score does not match pipe count' };
  }

  // Check game duration bounds
  if (gameDurationMs < MIN_GAME_DURATION_MS || gameDurationMs > MAX_GAME_DURATION_MS) {
    return { valid: false, reason: 'Invalid game duration' };
  }

  // For pipe count validation, check if timing is reasonable
  if (pipeCount > 0) {
    const avgTimePerPipe = gameDurationMs / pipeCount;
    if (avgTimePerPipe < MIN_PIPE_TIME_MS || avgTimePerPipe > MAX_PIPE_TIME_MS) {
      return { valid: false, reason: 'Suspicious pipe timing' };
    }
  }

  // Check for impossible scores
  if (score > 1000) {
    return { valid: false, reason: 'Score too high' };
  }

  return { valid: true };
}

// Check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, score, gameDurationMs, pipeCount } = req.body;

    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please wait before submitting again.' });
    }

    // Validate required fields
    if (!username || score === undefined || !gameDurationMs || pipeCount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sanitize username
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Validate score progression
    const validation = validateScoreProgression(score, gameDurationMs, pipeCount);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    // Check if score qualifies for top 10
    const { data: topScores } = await supabase
      .from('scores')
      .select('score')
      .order('score', { ascending: false })
      .limit(10);

    const minTopScore = topScores && topScores.length >= 10 
      ? topScores[topScores.length - 1].score 
      : 0;

    if (score < minTopScore) {
      return res.status(200).json({ 
        success: false, 
        message: 'Score did not qualify for top 10',
        currentTop10: topScores?.length || 0
      });
    }

    // Insert score
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          username: sanitizedUsername,
          score: score,
          game_duration_ms: gameDurationMs,
          pipe_count: pipeCount,
          ip_address: ip,
          user_agent: req.headers['user-agent'] || 'unknown'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to submit score' });
    }

    // Return success with updated leaderboard
    const { data: leaderboard } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false, nullsFirst: false })
      .limit(10);

    return res.status(200).json({ 
      success: true, 
      message: 'Score submitted successfully',
      leaderboard: leaderboard
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

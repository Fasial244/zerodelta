import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  challenge_id: string;
  flag_input: string; // Always send raw flag input - hashing done server-side
}

// Server-side flag hashing function
async function hashFlag(flag: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enhanced ReDoS protection constants
const MAX_INPUT_LENGTH = 500;
const MAX_REGEX_EXEC_TIME_MS = 100;

// Comprehensive dangerous pattern detection
const DANGEROUS_PATTERNS = [
  /\([^)]*\+[^)]*\)\+/,   // Nested quantifiers like (a+)+
  /\([^)]*\*[^)]*\)\*/,   // Nested quantifiers like (a*)*
  /\([^)]*\+[^)]*\)\*/,   // Mixed nested quantifiers (a+)*
  /\([^)]*\*[^)]*\)\+/,   // Mixed nested quantifiers (a*)+
  /\.\*\.\*\.\*/,         // Multiple greedy wildcards
  /\.\+\.\+\.\+/,         // Multiple greedy one-or-more
  /\([^)]+\|[^)]+\)\+/,   // Alternation with quantifier
  /\{[\d,]+\}\{[\d,]+\}/, // Consecutive quantifiers
];

function isSafeRegex(pattern: string): boolean {
  // Check for known dangerous patterns
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      console.warn('Dangerous regex pattern detected:', pattern);
      return false;
    }
  }
  
  // Check for excessive quantifiers
  const quantifierCount = (pattern.match(/[+*?]|\{\d+,?\d*\}/g) || []).length;
  if (quantifierCount > 10) {
    console.warn('Too many quantifiers in pattern:', pattern);
    return false;
  }
  
  // Check for deep nesting
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of pattern) {
    if (char === '(') currentDepth++;
    if (char === ')') currentDepth--;
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  if (maxDepth > 5) {
    console.warn('Pattern nesting too deep:', pattern);
    return false;
  }
  
  // Check pattern length
  if (pattern.length > 500) {
    console.warn('Pattern too long:', pattern.length);
    return false;
  }
  
  return true;
}

// Safe regex test with Promise.race timeout protection
async function safeRegexTestAsync(pattern: string, input: string): Promise<boolean> {
  // First validate pattern safety
  if (!isSafeRegex(pattern)) {
    console.error('Unsafe regex pattern rejected:', pattern);
    return false;
  }
  
  const startTime = performance.now();
  
  try {
    // Use Promise.race for timeout protection
    const result = await Promise.race([
      new Promise<boolean>((resolve) => {
        try {
          const regex = new RegExp(pattern);
          const testResult = regex.test(input);
          resolve(testResult);
        } catch (e) {
          console.error('Regex compilation error:', e);
          resolve(false);
        }
      }),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Regex timeout')), MAX_REGEX_EXEC_TIME_MS)
      )
    ]);
    
    const execTime = performance.now() - startTime;
    if (execTime > 50) {
      console.warn(`Slow regex execution: ${execTime.toFixed(2)}ms for pattern "${pattern.substring(0, 50)}..."`);
    }
    
    return result;
  } catch (error) {
    console.error('Regex execution failed or timed out:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is banned
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, team_id')
      .eq('id', user.id)
      .single();

    if (profile?.is_banned) {
      return new Response(JSON.stringify({ error: 'You are banned from submitting flags' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check game time window
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['game_start_time', 'game_end_time', 'game_paused', 'flag_salt']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => settingsMap[s.key] = s.value);

    const now = new Date();
    const startTime = settingsMap.game_start_time ? new Date(settingsMap.game_start_time) : null;
    const endTime = settingsMap.game_end_time ? new Date(settingsMap.game_end_time) : null;
    const isPaused = settingsMap.game_paused === 'true';

    if (isPaused) {
      return new Response(JSON.stringify({ error: 'Investigation is currently suspended' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (startTime && now < startTime) {
      return new Response(JSON.stringify({ error: 'Investigation has not started yet' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endTime && now > endTime) {
      return new Response(JSON.stringify({ error: 'Case has been closed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { challenge_id, flag_input } = body;

    if (!challenge_id) {
      return new Response(JSON.stringify({ error: 'Case ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!flag_input) {
      return new Response(JSON.stringify({ error: 'Evidence input required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input length validation for ReDoS protection
    if (flag_input.length > MAX_INPUT_LENGTH) {
      console.warn(`Flag input too long from user ${user.id}: ${flag_input.length} chars`);
      return new Response(JSON.stringify({ error: 'Evidence input exceeds maximum length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('submission_attempts')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneMinuteAgo);

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(JSON.stringify({ 
        error: 'Too many attempts. Please wait before trying again.',
        retry_after: 60 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already solved
    const { data: existingSolve } = await supabase
      .from('solves')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge_id)
      .single();

    if (existingSolve) {
      return new Response(JSON.stringify({ error: 'You have already cracked this case' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({ error: 'Case file not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check dependencies
    if (challenge.dependencies && challenge.dependencies.length > 0) {
      const { data: userSolves } = await supabase
        .from('solves')
        .select('challenge_id')
        .eq('user_id', user.id);

      const solvedIds = userSolves?.map(s => s.challenge_id) || [];
      const unmetDeps = challenge.dependencies.filter((d: string) => !solvedIds.includes(d));

      if (unmetDeps.length > 0) {
        return new Response(JSON.stringify({ error: 'You must complete prerequisite cases first' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify flag
    let isCorrect = false;
    const salt = settingsMap.flag_salt || 'zd_s3cr3t_s4lt_2024';

    if (challenge.flag_type === 'static') {
      // For static flags, hash server-side and compare
      const computedHash = await hashFlag(flag_input, salt);
      isCorrect = computedHash === challenge.flag_hash;
    } else if (challenge.flag_type === 'regex') {
      // For regex flags, validate pattern with enhanced ReDoS protection
      if (!challenge.flag_pattern) {
        console.error('Case missing regex pattern:', challenge_id);
        isCorrect = false;
      } else {
        // Use async safe regex test with timeout protection
        isCorrect = await safeRegexTestAsync(challenge.flag_pattern, flag_input);
      }
    }

    // Log attempt
    await supabase.from('submission_attempts').insert({
      user_id: user.id,
      challenge_id,
      is_correct: isCorrect,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Check for honeypot - hash the input server-side to compare
    const { data: honeypotSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'honeypot_hash')
      .single();

    if (honeypotSetting) {
      const inputHash = await hashFlag(flag_input, salt);
      if (inputHash === honeypotSetting.value) {
        await supabase.from('profiles').update({ is_banned: true }).eq('id', user.id);
        console.warn(`User ${user.id} banned for honeypot submission`);
        return new Response(JSON.stringify({ error: 'Access denied.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!isCorrect) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Incorrect evidence. Keep investigating.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate points with dynamic scoring
    const { data: decaySettings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['decay_rate', 'decay_factor', 'min_points', 'first_blood_bonus']);

    const decayMap: Record<string, string> = {};
    decaySettings?.forEach(s => decayMap[s.key] = s.value);

    const decayRate = parseFloat(decayMap.decay_rate || '0.5');
    const decayFactor = parseFloat(decayMap.decay_factor || '10');
    const minPoints = parseInt(decayMap.min_points || '50');
    const firstBloodBonus = parseInt(decayMap.first_blood_bonus || '10');

    // Check first blood
    const isFirstBlood = !challenge.first_blood_user_id;

    // Calculate base points with decay
    let awardedPoints = Math.max(
      minPoints,
      Math.floor(challenge.points * Math.pow(decayRate, challenge.solve_count / decayFactor))
    );

    // Add first blood bonus
    if (isFirstBlood) {
      awardedPoints += firstBloodBonus;
    }

    // Insert solve
    await supabase.from('solves').insert({
      user_id: user.id,
      challenge_id,
      team_id: profile?.team_id || null,
      points_awarded: awardedPoints,
      is_first_blood: isFirstBlood,
    });

    // Update challenge stats
    const updateData: Record<string, unknown> = { solve_count: challenge.solve_count + 1 };
    if (isFirstBlood) {
      updateData.first_blood_user_id = user.id;
      updateData.first_blood_at = new Date().toISOString();
    }
    await supabase.from('challenges').update(updateData).eq('id', challenge_id);

    // Update team score if applicable
    if (profile?.team_id) {
      const { data: team } = await supabase
        .from('teams')
        .select('score')
        .eq('id', profile.team_id)
        .single();
      
      if (team) {
        await supabase
          .from('teams')
          .update({ score: team.score + awardedPoints })
          .eq('id', profile.team_id);
      }
    }

    // Get username for activity log
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    // Log activity
    await supabase.from('activity_log').insert({
      event_type: isFirstBlood ? 'first_blood' : 'solve',
      user_id: user.id,
      challenge_id,
      team_id: profile?.team_id || null,
      points: awardedPoints,
      message: isFirstBlood 
        ? `🩸 ${userProfile?.username || 'Unknown'} drew FIRST BLOOD on ${challenge.title}!`
        : `${userProfile?.username || 'Unknown'} cracked ${challenge.title}`,
    });

    return new Response(JSON.stringify({
      success: true,
      points_awarded: awardedPoints,
      is_first_blood: isFirstBlood,
      message: isFirstBlood 
        ? `🩸 FIRST BLOOD! You earned ${awardedPoints} points (+${firstBloodBonus} bonus)!`
        : `Case cracked! You earned ${awardedPoints} points!`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying evidence:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

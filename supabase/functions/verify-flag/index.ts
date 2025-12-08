import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  challenge_id: string;
  flag_input: string;
  flag_hash?: string;
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
      return new Response(JSON.stringify({ error: 'CTF is currently paused' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (startTime && now < startTime) {
      return new Response(JSON.stringify({ error: 'CTF has not started yet' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endTime && now > endTime) {
      return new Response(JSON.stringify({ error: 'CTF has ended' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { challenge_id, flag_input, flag_hash } = body;

    if (!challenge_id) {
      return new Response(JSON.stringify({ error: 'Challenge ID required' }), {
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
        error: 'Rate limited. Please wait before trying again.',
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
      return new Response(JSON.stringify({ error: 'You have already solved this challenge' }), {
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
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
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
        return new Response(JSON.stringify({ error: 'You must complete prerequisite challenges first' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify flag
    let isCorrect = false;
    const salt = settingsMap.flag_salt || 'zd_s3cr3t_s4lt_2024';

    if (challenge.flag_type === 'static') {
      // For static flags, compare hashes
      if (!flag_hash) {
        return new Response(JSON.stringify({ error: 'Flag hash required for static challenges' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      isCorrect = flag_hash === challenge.flag_hash;
    } else if (challenge.flag_type === 'regex') {
      // For regex flags, validate pattern
      if (!flag_input) {
        return new Response(JSON.stringify({ error: 'Flag input required for regex challenges' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      try {
        const pattern = new RegExp(challenge.flag_pattern);
        isCorrect = pattern.test(flag_input);
      } catch {
        console.error('Invalid regex pattern:', challenge.flag_pattern);
        isCorrect = false;
      }
    }

    // Log attempt
    await supabase.from('submission_attempts').insert({
      user_id: user.id,
      challenge_id,
      is_correct: isCorrect,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Check for honeypot
    const honeypotHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // placeholder
    if (flag_hash === honeypotHash) {
      await supabase.from('profiles').update({ is_banned: true }).eq('id', user.id);
      return new Response(JSON.stringify({ error: 'Nice try.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isCorrect) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Incorrect flag. Try again.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate points with dynamic scoring
    const { data: decaySettings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['decay_rate', 'decay_factor', 'min_points']);

    const decayMap: Record<string, string> = {};
    decaySettings?.forEach(s => decayMap[s.key] = s.value);

    const decayRate = parseFloat(decayMap.decay_rate || '0.5');
    const decayFactor = parseFloat(decayMap.decay_factor || '10');
    const minPoints = parseInt(decayMap.min_points || '50');

    const awardedPoints = Math.max(
      minPoints,
      Math.floor(challenge.points * Math.pow(decayRate, challenge.solve_count / decayFactor))
    );

    // Check first blood
    const isFirstBlood = !challenge.first_blood_user_id;

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
        ? `🩸 ${userProfile?.username || 'Unknown'} got FIRST BLOOD on ${challenge.title}!`
        : `${userProfile?.username || 'Unknown'} solved ${challenge.title}`,
    });

    return new Response(JSON.stringify({
      success: true,
      points_awarded: awardedPoints,
      is_first_blood: isFirstBlood,
      message: isFirstBlood 
        ? `🩸 FIRST BLOOD! You earned ${awardedPoints} points!`
        : `Correct! You earned ${awardedPoints} points!`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying flag:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

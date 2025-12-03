import { supabase } from './supabase';

// AUTH
export async function signUpWithEmail({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
    },
  });

  if (error) throw error;

  const user = data?.user;
  // Only attempt to write to profiles when a session exists.
  // If email confirmation is required, data.session will be null and RLS would block this write.
  if (user && data?.session) {
    // Ensure a matching profile row exists
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName || null,
    });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const user = data?.user;
  if (user) {
    const displayName =
      user.user_metadata?.display_name ||
      (user.email ? user.email.split('@')[0] : null);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
    });

    if (profileError) throw profileError;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    const msg = (error.message || '').toLowerCase();
    // When there is no active auth session, Supabase can return an
    // "Auth session missing" error. In that case, treat as logged out.
    if (msg.includes('auth session missing') || msg.includes('session missing')) {
      return null;
    }
    throw error;
  }
  return data.user || null;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProfile(userId) {
  return getUserProfile(userId);
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserProfile(user.id);
}

export async function updateUserProfile({ displayName, photoUrl, bio }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not signed in');

  const updates = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (displayName !== undefined) updates.display_name = displayName;
  if (photoUrl !== undefined) updates.photo_url = photoUrl;
  if (bio !== undefined) updates.bio = bio;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(updates)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// SESSIONS
function generateInviteCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createActiveSession({
  name,
  isPublic = true,
  mode = 'uninterrupted',
  workMinutes,
  shortBreakMinutes = null,
  longBreakMinutes = null,
  inviteCode,
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const hostId = user.id;
  const finalInviteCode = inviteCode || generateInviteCode();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      host_id: hostId,
      name,
      is_public: isPublic,
      mode,
      work_minutes: workMinutes,
      short_break_minutes: shortBreakMinutes,
      long_break_minutes: longBreakMinutes,
      status: 'active',
      invite_code: finalInviteCode,
      started_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  // Add host as a participant so RLS policies work correctly
  // (guests need to see host's goals, which requires host to be in session_participants)
  const { error: participantError } = await supabase
    .from('session_participants')
    .upsert(
      {
        session_id: data.id,
        user_id: hostId,
        status: 'joined',
        joined_at: now,
      },
      { onConflict: 'session_id,user_id' }
    );

  if (participantError) {
    console.error('Failed to add host as participant:', participantError);
    // Don't throw - session was created successfully
  }

  return data;
}

export async function joinSessionById(sessionId) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('session_participants')
    .upsert(
      {
        session_id: sessionId,
        user_id: user.id,
        status: 'joined',
        joined_at: now,
      },
      { onConflict: 'session_id,user_id' }
    )
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export async function getSessionByInviteCode(inviteCode) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function joinSessionByInviteCode(inviteCode) {
  const session = await getSessionByInviteCode(inviteCode);
  if (!session) {
    throw new Error('Session not found');
  }
  return joinSessionById(session.id);
}

export async function listHostedSessions() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function listActiveHostedSessions() {
  const sessions = await listHostedSessions();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  return sessions.filter((s) => {
    // Include in_progress sessions
    if (s.status === 'in_progress') return true;
    // Include active sessions that are less than 10 minutes old
    if (s.status === 'active') return s.created_at > tenMinutesAgo;
    return false;
  });
}

// List all public active/in-progress sessions (for browse/join)
export async function listPublicActiveSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      profiles!sessions_host_id_fkey (
        id,
        display_name
      ),
      session_participants (
        user_id,
        profiles (
          id,
          display_name
        )
      )
    `)
    .eq('is_public', true)
    .in('status', ['active', 'in_progress'])
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  
  // Filter out sessions that haven't started within 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const validSessions = (data || []).filter(session => {
    // If session is in_progress, it's valid
    if (session.status === 'in_progress') return true;
    // If session is 'active' (waiting to start), check if it's less than 10 minutes old
    return session.created_at > tenMinutesAgo;
  });
  
  return validSessions;
}

// Clean up expired sessions (sessions that haven't started within 10 minutes)
export async function cleanupExpiredSessions() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('created_at', tenMinutesAgo)
    .select('id');

  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return [];
  }
  
  return data || [];
}

// Get session with host and participants info
export async function getSessionWithParticipants(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      profiles!sessions_host_id_fkey (
        id,
        display_name
      ),
      session_participants (
        user_id,
        status,
        profiles (
          id,
          display_name
        )
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionParticipants(sessionId) {
  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      *,
      profiles (
        id,
        display_name
      )
    `)
    .eq('session_id', sessionId)
    .in('status', ['joined', 'accepted']);

  if (error) throw error;
  return data || [];
}

export async function startSession(sessionId) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'in_progress',
      started_at: now,
    })
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function endSession(sessionId) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'ended',
      ended_at: now,
    })
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .select('*');

  // Don't throw error if no rows updated (user is not the host)
  if (error) throw error;
  
  // Return the first result or null if user wasn't the host
  return data && data.length > 0 ? data[0] : null;
}

export async function updateParticipantReady(sessionId, isReady) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('session_participants')
    .update({ is_ready: isReady })
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

// FOCUS GOALS
export async function saveFocusGoals(sessionId, goals) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  // Delete existing goals for this user in this session
  await supabase
    .from('focus_goals')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  // Insert new goals
  if (goals && goals.length > 0) {
    const goalsToInsert = goals.map(goal => ({
      session_id: sessionId,
      user_id: user.id,
      goal_text: typeof goal === 'string' ? goal : goal.text || goal.goal_text,
      is_completed: false,
    }));

    const { data, error } = await supabase
      .from('focus_goals')
      .insert(goalsToInsert)
      .select('*');

    if (error) throw error;
    return data;
  }

  return [];
}

export async function getFocusGoals(sessionId, userId = null) {
  let query = supabase
    .from('focus_goals')
    .select('*')
    .eq('session_id', sessionId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get all goals for all participants in a session (for displaying in active session)
export async function getAllSessionGoals(sessionId) {
  const { data, error } = await supabase
    .from('focus_goals')
    .select(`
      *,
      profiles:user_id (
        display_name
      )
    `)
    .eq('session_id', sessionId);

  if (error) throw error;
  return data || [];
}

export async function updateGoalCompletion(goalId, isCompleted) {
  const { data, error } = await supabase
    .from('focus_goals')
    .update({ is_completed: isCompleted })
    .eq('id', goalId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function leaveSession(sessionId) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
}

// REFLECTIONS
export async function saveReflection(sessionId, reflectionText) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('reflections')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      reflection_text: reflectionText,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getReflections(sessionId) {
  const { data, error } = await supabase
    .from('reflections')
    .select(`
      *,
      profiles (
        id,
        display_name
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ===== UNLOCK REQUESTS =====

export async function createUnlockRequest(sessionId, reason, participantCount) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  // Need approval from everyone except requester
  const approvalsNeeded = participantCount - 1;

  const { data, error } = await supabase
    .from('unlock_requests')
    .insert({
      session_id: sessionId,
      requester_id: user.id,
      reason,
      approvals_needed: approvalsNeeded,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function voteOnUnlockRequest(requestId, vote) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not signed in');

  // Insert vote
  const { error: voteError } = await supabase
    .from('unlock_votes')
    .insert({
      request_id: requestId,
      voter_id: user.id,
      vote,
    });

  if (voteError) throw voteError;

  // Get request to check if we should update status
  const { data: request, error: reqError } = await supabase
    .from('unlock_requests')
    .select('*, unlock_votes(*)')
    .eq('id', requestId)
    .single();

  if (reqError) throw reqError;

  const approveCount = request.unlock_votes.filter(v => v.vote === 'approve').length;
  const rejectCount = request.unlock_votes.filter(v => v.vote === 'reject').length;

  let newStatus = 'pending';
  if (approveCount >= request.approvals_needed) {
    newStatus = 'approved';
  } else if (rejectCount > 0) {
    // Even one rejection denies the request
    newStatus = 'rejected';
  }

  // Update request if status changed
  if (newStatus !== 'pending') {
    const { error: updateError } = await supabase
      .from('unlock_requests')
      .update({
        status: newStatus,
        approvals_received: approveCount,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
  }

  return { status: newStatus, approveCount, rejectCount };
}

export async function getPendingUnlockRequests(sessionId) {
  const { data, error } = await supabase
    .from('unlock_requests')
    .select(`
      *,
      profiles (
        id,
        display_name
      ),
      unlock_votes (
        id,
        vote,
        voter_id
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnlockRequest(requestId) {
  const { data, error } = await supabase
    .from('unlock_requests')
    .select(`
      *,
      profiles (
        id,
        display_name
      ),
      unlock_votes (
        id,
        vote,
        voter_id
      )
    `)
    .eq('id', requestId)
    .single();

  if (error) throw error;
  return data;
}

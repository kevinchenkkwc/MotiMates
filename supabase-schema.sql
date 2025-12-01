-- ============================================
-- MotiMates Supabase Schema - COMPLETE RESET
-- ============================================
-- Instructions:
-- 1. Copy this ENTIRE file
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run"
-- 4. Then go to Database → Replication and enable Realtime for:
--    - session_participants
--    - focus_goals

-- STEP 1: Drop everything (clean slate)
DROP TABLE IF EXISTS public.unlock_votes CASCADE;
DROP TABLE IF EXISTS public.unlock_requests CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;
DROP TABLE IF EXISTS public.focus_goals CASCADE;
DROP TABLE IF EXISTS public.session_participants CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_stats_on_session_end ON public.sessions;
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS update_user_stats_on_session_end();

-- STEP 2: Create tables with correct relationships

-- PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  photo_url TEXT,
  bio TEXT,
  total_focus_minutes INTEGER DEFAULT 0 NOT NULL,
  current_streak_days INTEGER DEFAULT 0 NOT NULL,
  longest_streak_days INTEGER DEFAULT 0 NOT NULL,
  last_active_date DATE,
  mate_rank INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Backfill profiles for any existing auth users
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1)
  ) AS display_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- SESSIONS
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'ended')),
  is_public BOOLEAN DEFAULT true NOT NULL,
  mode TEXT DEFAULT 'uninterrupted' CHECK (mode IN ('uninterrupted', 'pomodoro')),
  work_minutes INTEGER,
  short_break_minutes INTEGER,
  long_break_minutes INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public sessions" ON public.sessions;
CREATE POLICY "Anyone can view public sessions" 
  ON public.sessions FOR SELECT 
  USING (is_public = true OR host_id = auth.uid());

DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
CREATE POLICY "Users can create sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.sessions;
CREATE POLICY "Hosts can update their sessions" 
  ON public.sessions FOR UPDATE 
  USING (auth.uid() = host_id);

-- SESSION_PARTICIPANTS (with is_ready and proper FK)
CREATE TABLE public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'accepted', 'declined', 'left')),
  is_ready BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view session participants" ON public.session_participants;
CREATE POLICY "Users can view session participants" 
  ON public.session_participants FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
CREATE POLICY "Users can join sessions" 
  ON public.session_participants FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their participation" ON public.session_participants;
CREATE POLICY "Users can update their participation" 
  ON public.session_participants FOR UPDATE 
  USING (auth.uid() = user_id);

-- FOCUS_GOALS
CREATE TABLE public.focus_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.focus_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view goals in their sessions" ON public.focus_goals;
CREATE POLICY "Users can view goals in their sessions" 
  ON public.focus_goals FOR SELECT 
  USING (
    session_id IN (
      SELECT session_id FROM public.session_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own goals" ON public.focus_goals;
CREATE POLICY "Users can create their own goals" 
  ON public.focus_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.focus_goals;
CREATE POLICY "Users can update their own goals" 
  ON public.focus_goals FOR UPDATE 
  USING (auth.uid() = user_id);

-- REFLECTIONS
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reflections in their sessions" ON public.reflections;
CREATE POLICY "Users can view reflections in their sessions" 
  ON public.reflections FOR SELECT 
  USING (
    user_id = auth.uid() OR
    session_id IN (SELECT id FROM public.sessions WHERE host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create their own reflections" ON public.reflections;
CREATE POLICY "Users can create their own reflections" 
  ON public.reflections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UNLOCK_REQUESTS (for requesting permission to leave/unlock during session)
CREATE TABLE public.unlock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approvals_needed INTEGER NOT NULL,
  approvals_received INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view requests in their sessions" ON public.unlock_requests;
CREATE POLICY "Users can view requests in their sessions" 
  ON public.unlock_requests FOR SELECT 
  USING (
    session_id IN (
      SELECT session_id FROM public.session_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create unlock requests" ON public.unlock_requests;
CREATE POLICY "Users can create unlock requests" 
  ON public.unlock_requests FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update request status" ON public.unlock_requests;
CREATE POLICY "Users can update request status" 
  ON public.unlock_requests FOR UPDATE 
  USING (
    session_id IN (
      SELECT session_id FROM public.session_participants WHERE user_id = auth.uid()
    )
  );

-- UNLOCK_VOTES (track individual votes on unlock requests)
CREATE TABLE public.unlock_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.unlock_requests(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(request_id, voter_id)
);

ALTER TABLE public.unlock_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view votes" ON public.unlock_votes;
CREATE POLICY "Users can view votes" 
  ON public.unlock_votes FOR SELECT 
  USING (
    request_id IN (
      SELECT id FROM public.unlock_requests WHERE session_id IN (
        SELECT session_id FROM public.session_participants WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can vote on requests" ON public.unlock_votes;
CREATE POLICY "Users can vote on requests" 
  ON public.unlock_votes FOR INSERT 
  WITH CHECK (auth.uid() = voter_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Create triggers and functions

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to update user stats when session ends
CREATE OR REPLACE FUNCTION update_user_stats_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
    UPDATE public.profiles
    SET 
      total_focus_minutes = total_focus_minutes + COALESCE(NEW.work_minutes, 0),
      last_active_date = CURRENT_DATE,
      current_streak_days = CASE
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' 
          THEN current_streak_days + 1
        WHEN last_active_date = CURRENT_DATE 
          THEN current_streak_days
        ELSE 1
      END,
      longest_streak_days = GREATEST(
        longest_streak_days,
        CASE
          WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' 
            THEN current_streak_days + 1
          WHEN last_active_date = CURRENT_DATE 
            THEN current_streak_days
          ELSE 1
        END
      )
    WHERE id IN (
      SELECT user_id FROM public.session_participants 
      WHERE session_id = NEW.id AND status = 'joined'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_session_end
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_session_end();

-- ============================================
-- DONE! Schema created successfully.
-- ============================================
-- 
-- NEXT STEPS:
-- 1. Restart your Expo app:
--    npx expo start --clear --go
--
-- 2. Log in and test multi-device session!
-- 
-- NOTE: Real-time sync now uses Supabase Broadcast
-- (doesn't require Replication alpha access).
-- You should see console logs in Expo Go terminal like:
--   [Broadcast] Channel status: SUBSCRIBED
--   [Broadcast] Ready status changed: {...}
--   [Broadcast] Session started!
-- ============================================

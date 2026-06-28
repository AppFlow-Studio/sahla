-- CRM-V1-MIGRATIONS: reels — short-form vertical video.
-- Schema-only; UI deferred per spec §4 cut line. Lands now to keep the door
-- open without UI distractions.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

CREATE TABLE public.reels (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reel_id UUID UNIQUE DEFAULT gen_random_uuid(),
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec INT,
  view_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reels_mosque_published ON public.reels(mosque_id, is_published, display_order);
CREATE INDEX idx_reels_recent ON public.reels(mosque_id, created_at DESC);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY reels_mosque_select ON public.reels
  FOR SELECT USING (mosque_id = public.requesting_mosque_id() AND is_published = true);
CREATE POLICY reels_admin_all ON public.reels
  FOR ALL USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY reels_sahla_all ON public.reels
  FOR ALL USING (public.is_sahla_team());

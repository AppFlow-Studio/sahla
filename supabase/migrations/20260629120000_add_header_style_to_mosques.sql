-- Per-masjid home-screen header style. Chosen by the masjid admin during
-- onboarding / in the CRM theme setup; read by the app's ConfigProvider and
-- rendered by the home header (mirrors how font_theme flows). Value is a key
-- from the app's src/theme/header-style.ts:
--   'classic' | 'countdown-centered' | 'countdown-left'.
alter table public.mosques
  add column header_style text not null default 'classic';

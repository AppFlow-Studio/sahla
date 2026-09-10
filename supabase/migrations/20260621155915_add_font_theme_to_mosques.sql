-- Per-masjid font theme. Chosen by the masjid admin during onboarding /
-- in the CRM theme setup; read by the app's ConfigProvider and applied via
-- ThemeRoot (mirrors how brand_color flows). Value is a key from
-- src/theme/fonts.ts (FONT_THEMES): 'classic' | 'modern' | 'elegant'.
alter table public.mosques
  add column font_theme text not null default 'classic';

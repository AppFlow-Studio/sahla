-- Make the mosques table's brand + accent defaults match the actual Sahla
-- brand palette instead of the placeholder that was seeded on day one.
--
-- Baseline was:
--   brand_color  text DEFAULT '#0D7C5F'  (bright teal — NOT Sahla)
--   accent_color text                    (NULL default)
--
-- The onboarding preview and app-branding panel already fall back to
-- Sahla's `#0A261E` / `#B8922A` when the column is null, but the DB
-- default `#0D7C5F` short-circuited that fallback for every mosque
-- created via the pipeline flow. Result: fresh admins saw an off-brand
-- teal preview until they manually picked colors.
--
-- Fix has two parts:
--   1. New defaults align with Sahla brand (deep green + gold).
--   2. Backfill existing rows that were never customized — every mosque
--      still on the old `#0D7C5F` default gets moved to Sahla deep green,
--      and every null accent gets Sahla gold. This is safe because none
--      of the current rows on that value actually chose it; they inherited
--      it from the bad default.

ALTER TABLE mosques ALTER COLUMN brand_color  SET DEFAULT '#0A261E';
ALTER TABLE mosques ALTER COLUMN accent_color SET DEFAULT '#B8922A';

UPDATE mosques SET brand_color  = '#0A261E' WHERE brand_color  = '#0D7C5F';
UPDATE mosques SET accent_color = '#B8922A' WHERE accent_color IS NULL;

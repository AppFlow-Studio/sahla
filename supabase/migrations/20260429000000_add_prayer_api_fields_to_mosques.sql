-- =============================================================================
-- Add Al Adhan prayer API configuration fields to mosques
-- These allow each mosque to customize their prayer time API call beyond
-- the address, calculation_method, and school that already exist.
-- =============================================================================

-- Asr midnight calculation: 0 = Standard (mid sunset-to-sunrise), 1 = Jami (mid sunset-to-fajr)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS midnight_mode integer DEFAULT 0;

-- High-latitude adjustment: 1 = middle of night, 2 = one-seventh, 3 = angle-based
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS latitude_adjustment_method integer;

-- Per-prayer minute offsets (comma-separated: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS prayer_tune text;

-- Shafaq type for Moonsighting method: 'general', 'ahmer', 'abyad'
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS shafaq text DEFAULT 'general';

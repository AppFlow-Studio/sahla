-- One-time seed: tag the 6 existing demo reels with interest categories so
-- the recommendation feature has signal to score against. Future uploads
-- will tag at create-time via reels-upload.
--
-- Shape: one row per (reel, interest) pair. The composite PK on
-- reel_islamic_interests means duplicates would error, so this file is safe
-- to re-run against an empty table but should NOT be re-run after edits.
--
-- INSERT ... ON CONFLICT DO NOTHING makes the migration idempotent — re-runs
-- are no-ops instead of errors.

insert into public.reel_islamic_interests (reel_id, interest_id) values
  -- "Prepare Before the Fitnah Comes"
  ('85b0f736-0e7c-4a30-afdf-240bcbd6b9eb', 6),   -- Hadith
  ('85b0f736-0e7c-4a30-afdf-240bcbd6b9eb', 50),  -- Seeking Knowledge
  ('85b0f736-0e7c-4a30-afdf-240bcbd6b9eb', 55),  -- Signs of the Last Day

  -- "Love for the Sake of Allah"
  ('c2376bfb-b1ff-4c5b-93f5-39846b946884', 6),   -- Hadith
  ('c2376bfb-b1ff-4c5b-93f5-39846b946884', 28),  -- Character Building

  -- "The Quran Was Preserved…"
  ('454fb6f4-941c-4930-a67b-88b4034d2ee9', 8),   -- Quran Reflection
  ('454fb6f4-941c-4930-a67b-88b4034d2ee9', 6),   -- Hadith
  ('454fb6f4-941c-4930-a67b-88b4034d2ee9', 57),  -- Self Accountability

  -- "Before the Flaws Surface!" — Mohammad Elshinawy
  ('0dc35201-c639-4568-8bc1-cfcb15c2b530', 3),   -- Tazkiyah
  ('0dc35201-c639-4568-8bc1-cfcb15c2b530', 28),  -- Character Building
  ('0dc35201-c639-4568-8bc1-cfcb15c2b530', 53),  -- Jannah
  ('0dc35201-c639-4568-8bc1-cfcb15c2b530', 57),  -- Self Accountability

  -- "Captured Thoughts" — caption was just a TikTok ID, best-guess generic
  ('8c65af2b-072a-4386-96f7-814d9184474c', 6),   -- Hadith
  ('8c65af2b-072a-4386-96f7-814d9184474c', 42),  -- Daily Sunnah

  -- Test reel (placeholder content) — minimal tag so it doesn't sit orphan
  ('5de0acf6-6917-4e24-8aab-5ebfb43bd3b9', 50)   -- Seeking Knowledge
on conflict do nothing;

/* ════════════════════════════════════════════════════════════════════════
   REFERENCE DATA — the 6 published reels in staging, ordered by display_order:

   reel_id                                 │ topic (per caption)
   ────────────────────────────────────────┼───────────────────────────────────
   5de0acf6-6917-4e24-8aab-5ebfb43bd3b9    │ Test Reel (compressed) — just a
                                           │ test upload, probably leave untagged
                                           │ or tag generically.

   85b0f736-0e7c-4a30-afdf-240bcbd6b9eb    │ "Prepare Before the Fitnah Comes"
                                           │ — iman, fitnah, seeking knowledge,
                                           │ end-times warning, hadith.
                                           │ Suggested: 6 (Hadith), 50 (Seeking
                                           │ Knowledge), 55 (Signs of the Last
                                           │ Day), 32 (Trust in Allah)

   8c65af2b-072a-4386-96f7-814d9184474c    │ Caption is just "TikTok video #..."
                                           │ — you remember what this one was.

   c2376bfb-b1ff-4c5b-93f5-39846b946884    │ "Love for the Sake of Allah" —
                                           │ brotherhood, sincerity, hadith.
                                           │ Suggested: 6 (Hadith), 28
                                           │ (Character Building), 34 (Islamic
                                           │ Manners), 51 (Islam and Society)

   454fb6f4-941c-4930-a67b-88b4034d2ee9    │ "The Quran Was Preserved…" — quran,
                                           │ ummah, holding firm to teachings.
                                           │ Suggested: 8 (Quran Reflection),
                                           │ 6 (Hadith), 57 (Self Accountability)

   0dc35201-c639-4568-8bc1-cfcb15c2b530    │ "Before the Flaws Surface!" by
                                           │ Mohammad Elshinawy — taqwa, jannah,
                                           │ good character.
                                           │ Suggested: 3 (Tazkiyah), 28
                                           │ (Character Building), 53 (Jannah),
                                           │ 57 (Self Accountability)

   ────────────────────────────────────────────────────────────────────────
   INTEREST CATALOG — relevant subset (full list: islamic_interest_categories)

   id │ name                  │ id │ name
   ───┼───────────────────────┼────┼─────────────────────────
    1 │ Fiqh                  │ 28 │ Character Building
    3 │ Tazkiyah              │ 29 │ Patience
    4 │ Seerah                │ 30 │ Gratitude
    5 │ Aqidah                │ 31 │ Repentance
    6 │ Hadith                │ 32 │ Trust in Allah
    7 │ Tafsir                │ 34 │ Islamic Manners
    8 │ Quran Reflection      │ 42 │ Daily Sunnah
    9 │ Dua                   │ 45 │ Jumuah
   10 │ Dhikr                 │ 46 │ Ramadan
   17 │ Islamic History       │ 50 │ Seeking Knowledge
   18 │ Companions            │ 51 │ Islam and Society
   19 │ Stories of Prophets   │ 52 │ Death and Hereafter
                              │ 53 │ Jannah
                              │ 55 │ Signs of the Last Day
                              │ 57 │ Self Accountability
   ════════════════════════════════════════════════════════════════════════ */

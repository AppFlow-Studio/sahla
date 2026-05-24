alter table reels
  add column arabic text,
  add column urdu text,
  add column translation text,
  add column source text;

comment on column reels.arabic is 'Arabic ayah/quote rendered as a center-screen overlay when present.';
comment on column reels.urdu is 'Optional Urdu line shown below the Arabic.';
comment on column reels.translation is 'English (or other) translation rendered below the Arabic/Urdu.';
comment on column reels.source is 'Citation shown under the translation (e.g. "Quran 94:6").';

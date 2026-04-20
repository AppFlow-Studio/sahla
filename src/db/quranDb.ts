import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const ARABIC_DB = 'Uthmani.db';
const TRANSLATION_DB = 'EnglishTranslation.db';
const CHAPTERS_DB = 'quran-metadata-surah-name.sqlite';
const SAJDAH_DB = 'quran-metadata-sajda.sqlite';
const JUZ_DB = 'quran-metadata-juz.sqlite';
const THEMES_DB = 'ayah-themes.db';
const PAGES_DB = 'mushaf-qatar-layout.sqlite';

export type SajdahType = 'optional' | 'required';

export type Surah = {
  surah_number: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_order: number;
  revelation_place: 'makkah' | 'madinah';
  bismillah_pre: boolean;
};

export type Ayah = {
  surah_number: number;
  verse_number: number;
  text_uthmani: string;
  translation: string | null;
  is_sajdah: boolean;
  sajdah_type: SajdahType | null;
  page: number | null;
};

export type MushafLine = {
  page_number: number;
  line_number: number;
  line_type: 'surah_name' | 'ayah' | 'basmallah';
  is_centered: number; // 0 | 1 from SQLite
  surah_number: number | null;
  text: string;
};

export const TOTAL_MUSHAF_PAGES = 604;

export type Theme = {
  theme: string;
  surah_number: number;
  ayah_from: number;
  ayah_to: number;
  keywords: string[];
  total_ayahs: number;
};

export type Juz = {
  juz_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
  verse_mapping: Record<string, string>;
};

export const BISMILLAH_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let sajdahLookup: Map<string, SajdahType> | null = null;
let pageLookup: Map<string, number> | null = null;

async function copyAssetToSQLiteDir(
  assetModule: number,
  fileName: string
): Promise<void> {
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${sqliteDir}/${fileName}`;

  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (fileInfo.exists) return;

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error(`Failed to resolve bundled asset for ${fileName}.`);
  }
  await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  await Promise.all([
    copyAssetToSQLiteDir(require('../../assets/db/Uthmani.db'), ARABIC_DB),
    copyAssetToSQLiteDir(
      require('../../assets/db/EnglishTranslation.db'),
      TRANSLATION_DB
    ),
    copyAssetToSQLiteDir(
      require('../../assets/quran-metadata/quran-metadata-surah-name.sqlite'),
      CHAPTERS_DB
    ),
    copyAssetToSQLiteDir(
      require('../../assets/quran-metadata/quran-metadata-sajda.sqlite'),
      SAJDAH_DB
    ),
    copyAssetToSQLiteDir(
      require('../../assets/quran-metadata/quran-metadata-juz.sqlite'),
      JUZ_DB
    ),
    copyAssetToSQLiteDir(
      require('../../assets/db/ayah-themes.db'),
      THEMES_DB
    ),
    copyAssetToSQLiteDir(
      require('../../assets/quran-metadata/mushaf-qatar-layout.sqlite'),
      PAGES_DB
    ),
  ]);

  const db = await SQLite.openDatabaseAsync(ARABIC_DB);
  // SQLite ATTACH expects a plain filesystem path; FileSystem.documentDirectory
  // returns a `file://` URI, so strip the scheme.
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`.replace(
    /^file:\/\//,
    ''
  );
  await db.execAsync(
    `ATTACH DATABASE '${sqliteDir}/${TRANSLATION_DB}' AS trdb;
     ATTACH DATABASE '${sqliteDir}/${CHAPTERS_DB}' AS chdb;
     ATTACH DATABASE '${sqliteDir}/${SAJDAH_DB}' AS sjdb;
     ATTACH DATABASE '${sqliteDir}/${JUZ_DB}' AS jzdb;
     ATTACH DATABASE '${sqliteDir}/${THEMES_DB}' AS thdb;
     ATTACH DATABASE '${sqliteDir}/${PAGES_DB}' AS pgdb;`
  );

  // Faster reads: WAL journal + bigger page cache. Safe for read-heavy DBs.
  await db.execAsync(
    `PRAGMA journal_mode = WAL;
     PRAGMA temp_store = MEMORY;
     PRAGMA cache_size = -8000;`
  );

  // Indexes (no-op after first run):
  //   - words(surah, ayah, word): per-surah ordered scans in getAyahs()
  //   - pages(first_word_id): range-scan anchor for the ayah→page JOIN
  //   - ayah_pages_cache(surah, ayah): persistent cache of the JOIN result
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_words_surah_ayah_word
       ON words (surah, ayah, word);
     CREATE INDEX IF NOT EXISTS pgdb.idx_pages_first_word
       ON pages (first_word_id);
     CREATE TABLE IF NOT EXISTS ayah_pages_cache (
       surah INTEGER,
       ayah  INTEGER,
       page  INTEGER,
       PRIMARY KEY (surah, ayah)
     );`
  );

  // Populate cache once; skip the JOIN on all subsequent launches.
  const cached = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ayah_pages_cache`
  );
  if (!cached || cached.c === 0) {
    await db.execAsync(
      `INSERT INTO ayah_pages_cache (surah, ayah, page)
       SELECT w.surah, w.ayah, MIN(p.page_number)
       FROM words w
       JOIN pgdb.pages p
         ON w.id BETWEEN p.first_word_id AND p.last_word_id
       WHERE p.line_type = 'ayah'
       GROUP BY w.surah, w.ayah;`
    );
  }

  // Preload sajdah lookup.
  const sajdahRows = await db.getAllAsync<{
    verse_key: string;
    sajdah_type: SajdahType;
  }>(`SELECT verse_key, sajdah_type FROM sjdb.sajdah`);
  sajdahLookup = new Map(sajdahRows.map((r) => [r.verse_key, r.sajdah_type]));

  // Preload ayah→page lookup from the cache table (built once above).
  const pageRows = await db.getAllAsync<{
    surah: number;
    ayah: number;
    page: number;
  }>(`SELECT surah, ayah, page FROM ayah_pages_cache`);
  pageLookup = new Map(
    pageRows.map((r) => [`${r.surah}:${r.ayah}`, r.page])
  );

  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

export async function initQuranDb(): Promise<void> {
  await getDatabase();
}

export function isSajdah(surah: number, ayah: number): boolean {
  return sajdahLookup?.has(`${surah}:${ayah}`) ?? false;
}

export function sajdahType(surah: number, ayah: number): SajdahType | null {
  return sajdahLookup?.get(`${surah}:${ayah}`) ?? null;
}

export function getPageForAyah(surah: number, ayah: number): number | null {
  return pageLookup?.get(`${surah}:${ayah}`) ?? null;
}

/**
 * Bismillah rendering rule:
 *  - Uses the `bismillah_pre` flag from the chapters metadata.
 *  - Surah 1 (Al-Fatihah) has bismillah_pre = 0 because Bismillah IS its
 *    first ayah; don't render a separate header.
 *  - Surah 9 (At-Tawbah) has bismillah_pre = 0 because it has no Bismillah.
 *  - All other surahs have bismillah_pre = 1; render a standalone header.
 */
export function shouldShowBismillahHeader(surah: Surah): boolean {
  return surah.bismillah_pre;
}

export async function getSurahs(): Promise<Surah[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name_simple: string;
    name_arabic: string;
    verses_count: number;
    revelation_order: number;
    revelation_place: 'makkah' | 'madinah';
    bismillah_pre: number;
  }>(
    `SELECT id, name_simple, name_arabic, verses_count,
            revelation_order, revelation_place, bismillah_pre
     FROM chdb.chapters
     ORDER BY id ASC`
  );
  return rows.map((r) => ({
    surah_number: r.id,
    name_simple: r.name_simple,
    name_arabic: r.name_arabic,
    verses_count: r.verses_count,
    revelation_order: r.revelation_order,
    revelation_place: r.revelation_place,
    bismillah_pre: r.bismillah_pre === 1,
  }));
}

export async function getAyahs(surahNumber: number): Promise<Ayah[]> {
  const db = await getDatabase();
  // Single-pass: pre-order words by (ayah, word), then GROUP_CONCAT in that
  // order. The trailing token in each concat is the ayah-number glyph (e.g.
  // ١), which we strip in JS rather than via another correlated subquery.
  const rows = await db.getAllAsync<{
    surah_number: number;
    verse_number: number;
    text_with_glyph: string;
    translation: string | null;
  }>(
    `SELECT
        w.surah AS surah_number,
        w.ayah  AS verse_number,
        GROUP_CONCAT(w.text, ' ') AS text_with_glyph,
        t.text AS translation
     FROM (
       SELECT surah, ayah, word, text
       FROM words
       WHERE surah = ?
       ORDER BY ayah ASC, word ASC
     ) w
     LEFT JOIN trdb.translation t
       ON t.sura = w.surah AND t.ayah = w.ayah
     GROUP BY w.surah, w.ayah
     ORDER BY w.ayah ASC`,
    [surahNumber]
  );
  return rows.map((r) => {
    const tokens = r.text_with_glyph.split(' ');
    tokens.pop(); // drop trailing ayah-number glyph
    return {
      surah_number: r.surah_number,
      verse_number: r.verse_number,
      text_uthmani: tokens.join(' '),
      translation: r.translation,
      is_sajdah: isSajdah(r.surah_number, r.verse_number),
      sajdah_type: sajdahType(r.surah_number, r.verse_number),
      page: getPageForAyah(r.surah_number, r.verse_number),
    };
  });
}

export async function getThemesForSurah(surahNumber: number): Promise<Theme[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    theme: string;
    surah_number: number;
    ayah_from: number;
    ayah_to: number;
    keywords: string | null;
    total_ayahs: number;
  }>(
    `SELECT DISTINCT theme, surah_number, ayah_from, ayah_to, keywords, total_ayahs
     FROM thdb.themes
     WHERE surah_number = ?
     ORDER BY ayah_from ASC`,
    [surahNumber]
  );
  return rows.map((r) => ({
    theme: r.theme,
    surah_number: r.surah_number,
    ayah_from: r.ayah_from,
    ayah_to: r.ayah_to,
    keywords: r.keywords
      ? r.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
    total_ayahs: r.total_ayahs,
  }));
}

export async function getMushafPage(pageNumber: number): Promise<MushafLine[]> {
  const db = await getDatabase();
  return db.getAllAsync<MushafLine>(
    `SELECT
        p.page_number,
        p.line_number,
        p.line_type,
        p.is_centered AS is_centered,
        p.surah_number,
        COALESCE(
          (SELECT GROUP_CONCAT(text, ' ')
           FROM (
             SELECT text FROM words
             WHERE id BETWEEN p.first_word_id AND p.last_word_id
             ORDER BY id ASC
           )),
          ''
        ) AS text
     FROM pgdb.pages p
     WHERE p.page_number = ?
     ORDER BY p.line_number ASC`,
    [pageNumber]
  );
}

export async function getJuzList(): Promise<Juz[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    juz_number: number;
    verses_count: number;
    first_verse_key: string;
    last_verse_key: string;
    verse_mapping: string;
  }>(
    `SELECT juz_number, verses_count, first_verse_key, last_verse_key, verse_mapping
     FROM jzdb.juz
     ORDER BY juz_number ASC`
  );
  return rows.map((r) => ({
    juz_number: r.juz_number,
    verses_count: r.verses_count,
    first_verse_key: r.first_verse_key,
    last_verse_key: r.last_verse_key,
    verse_mapping: JSON.parse(r.verse_mapping) as Record<string, string>,
  }));
}

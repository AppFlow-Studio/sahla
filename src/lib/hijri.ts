/**
 * Hijri (Islamic Umm al-Qura) date formatter.
 *
 * Uses Intl.DateTimeFormat with the `islamic-umalqura` calendar. Hermes ICU
 * support varies by RN version — falls back to the Gregorian date if the
 * calendar isn't recognized so the UI never renders empty.
 */
export function getHijriDate(date: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    // Strip the trailing " AH" suffix some ICU builds append.
    return formatted.replace(/\s*AH$/, '');
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}

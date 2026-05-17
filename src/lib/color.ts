/**
 * Convert a CSS hex color (e.g. `"#10b981"` or `"#10B981"`) into the
 * space-separated RGB triplet that NativeWind's `rgb(var(--x) / <alpha-value>)`
 * pattern expects (e.g. `"16 185 129"`).
 *
 * Returns `null` for invalid input so callers can fall back to a default
 * instead of silently painting black.
 */
export function hexToRgbTriplet(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const normalised = hex.trim().replace(/^#/, '');
  const expanded =
    normalised.length === 3
      ? normalised
          .split('')
          .map((c) => c + c)
          .join('')
      : normalised;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Multiply each channel of an `"R G B"` triplet by `factor` (0–1) to produce
 * a darker shade. Used to derive layered tokens (depth, shadow) from a
 * masjid's primary brand color when no explicit override is provided.
 */
export function darkenTriplet(triplet: string, factor: number): string {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return triplet;
  const [r, g, b] = parts;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n * factor)));
  return `${clamp(r)} ${clamp(g)} ${clamp(b)}`;
}

/**
 * Heuristic filter for PSN game images.
 * Purpose: avoid using hero / banner / promo images when a square icon is expected.
 *
 * NOTE:
 * - This does NOT transform the URL
 * - It currently returns the original URL in all cases
 * - Logic may evolve to select between multiple image candidates
 */
export function resolveGameIcon(rawUrl: string) {
  if (!rawUrl) return rawUrl;

  const url = rawUrl.toLowerCase();

  // 1. PRIORITY: file name contains "icon"
  if (
    url.includes("icon0") ||
    url.includes("icon.") ||
    url.includes("appicon")
  ) {
    return rawUrl;
  }

  // 2. PRIORITY: URLs ending in PNG but not containing suspicious patterns
  const suspicious = ["hero", "cover", "banner", "promo", "background"];
  if (!suspicious.some((word) => url.includes(word))) {
    return rawUrl;
  }

  // 3. LAST RESORT fallback: just return the original
  return rawUrl;
}

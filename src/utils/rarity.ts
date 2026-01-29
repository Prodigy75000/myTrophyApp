// utils/rarity.ts

/**
 * Definition of Rarity Tiers.
 * Using "as const" allows TypeScript to infer specific string literals.
 */
export const RARITY_TIERS = {
  ULTRA_RARE: "ULTRA_RARE",
  VERY_RARE: "VERY_RARE",
  RARE: "RARE",
  COMMON: "COMMON",
} as const;

export type RarityTier = (typeof RARITY_TIERS)[keyof typeof RARITY_TIERS];

/**
 * Configuration for Rarity Thresholds (Percentages).
 * Adjust these values to change the difficulty curves.
 */
const RARITY_THRESHOLDS = {
  ULTRA: 5,
  VERY: 15,
  RARE: 50,
};

/**
 * Visual configuration for Rarity Tiers.
 * These hex codes correspond to the visual identity of the rarity.
 */
export const RARITY_COLORS: Record<RarityTier, string> = {
  [RARITY_TIERS.ULTRA_RARE]: "#d4af37", // Gold
  [RARITY_TIERS.VERY_RARE]: "#a0a0a0", // Silver/White
  [RARITY_TIERS.RARE]: "#cd7f32", // Bronze
  [RARITY_TIERS.COMMON]: "#555555", // Dark Grey
};

/**
 * Calculates the rarity tier based on the percentage of players who earned the trophy.
 *
 * @param percentage - The percentage (0-100) of players who have this trophy.
 * @returns The corresponding RarityTier.
 */
export function getRarityTier(percentage: number | string): RarityTier {
  // Ensure we are working with a valid number
  const p = typeof percentage === "string" ? parseFloat(percentage) : percentage;

  if (isNaN(p)) {
    console.warn(
      `⚠️ getRarityTier received invalid input: ${percentage}. Defaulting to COMMON.`
    );
    return RARITY_TIERS.COMMON;
  }

  if (p <= RARITY_THRESHOLDS.ULTRA) return RARITY_TIERS.ULTRA_RARE;
  if (p <= RARITY_THRESHOLDS.VERY) return RARITY_TIERS.VERY_RARE;
  if (p <= RARITY_THRESHOLDS.RARE) return RARITY_TIERS.RARE;

  return RARITY_TIERS.COMMON;
}

/**
 * Retrieves the color associated with a specific rarity tier.
 *
 * @param tier - The RarityTier to look up.
 * @returns The hex color string.
 */
export function getRarityColor(tier: RarityTier): string {
  // Return the specific color, or fallback to common/grey if the tier is somehow invalid
  return RARITY_COLORS[tier] || RARITY_COLORS.COMMON;
}

export type RarityTier = "COMMON" | "RARE" | "VERY_RARE" | "ULTRA_RARE";

export function getRarityTier(percentage: number | string): RarityTier {
  const p = Number(percentage);
  if (p <= 5) return "ULTRA_RARE";
  if (p <= 15) return "VERY_RARE";
  if (p <= 50) return "RARE";
  return "COMMON";
}

export function getRarityColor(tier: RarityTier): string {
  switch (tier) {
    case "ULTRA_RARE":
      return "#d4af37"; // Gold
    case "VERY_RARE":
      return "#a0a0a0"; // Silver/White
    case "RARE":
      return "#cd7f32"; // Bronze
    default:
      return "#555"; // Dark Grey
  }
}

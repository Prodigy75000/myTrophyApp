// utils/normalizeTrophy.ts
export type TrophyType = "bronze" | "silver" | "gold" | "platinum";

export function normalizeTrophyType(type: string): TrophyType {
  switch (type.toLowerCase()) {
    case "bronze":
    case "silver":
    case "gold":
    case "platinum":
      return type.toLowerCase() as TrophyType;
    default:
      console.warn("⚠️ Unknown trophy type:", type);
      return "bronze";
  }
}

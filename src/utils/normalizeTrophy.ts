// utils/normalizeTrophy.ts

/**
 * The definitive list of valid trophy types supported by the application.
 * Using "as const" ensures TypeScript treats these as specific literals, not just strings.
 */
export const TROPHY_TYPES = ["bronze", "silver", "gold", "platinum"] as const;

/**
 * Deriving the type from the array above.
 * Equivalent to: "bronze" | "silver" | "gold" | "platinum"
 */
export type TrophyType = (typeof TROPHY_TYPES)[number];

/**
 * Normalizes an incoming string to a valid TrophyType.
 * Useful for handling raw API data where casing or unexpected values might occur.
 *
 * @param type - The raw string string from the API (e.g., "Bronze", "GOLD", "hidden")
 * @returns A valid TrophyType, defaulting to "bronze" if the input is invalid.
 */
export function normalizeTrophyType(type: string): TrophyType {
  if (!type) {
    console.warn(
      "⚠️ normalizeTrophyType: Received empty or undefined type. Defaulting to bronze."
    );
    return "bronze";
  }

  const lowerType = type.toLowerCase();

  // Type predicate: check if our lowerType exists in the known array
  if (TROPHY_TYPES.includes(lowerType as TrophyType)) {
    return lowerType as TrophyType;
  }

  console.warn(`⚠️ Unknown trophy type encountered: "${type}". Defaulting to "bronze".`);
  return "bronze";
}

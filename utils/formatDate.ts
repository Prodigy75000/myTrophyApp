// utils/formatDate.ts

/**
 * Formats an ISO date string into a readable French date and time.
 * Example Output: "20 janv. 2026 14:09"
 *
 * @param isoString - The ISO 8601 date string (e.g., "2024-01-20T14:30:00Z").
 * @param locale - The locale string to use for formatting. Defaults to "fr-FR".
 * @returns A formatted string, or "N/A" if the input is invalid or missing.
 */
export function formatDate(isoString?: string | null, locale: string = "fr-FR"): string {
  if (!isoString) return "N/A";

  const date = new Date(isoString);

  // Safety check: Ensure the date is valid before trying to format it
  if (isNaN(date.getTime())) {
    console.warn(`⚠️ formatDate: Invalid date string received "${isoString}"`);
    return "Date invalid";
  }

  const datePart = date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timePart = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
}

/**
 * Parse join date from user ID format
 * Format: YYDDD-XXXXX where YY = year (last 2 digits), DDD = day of year
 * Example: 26006-KNHR52 = Day 6 of 2026
 */
export function parseJoinDateFromUserId(userId: string): Date | null {
  if (!userId || typeof userId !== "string") return null;

  // Extract first 5 characters (YYDDD)
  const match = userId.match(/^(\d{2})(\d{3})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const dayOfYear = parseInt(match[2], 10);

  // Convert to full year (assuming 20XX)
  const fullYear = 2000 + year;

  // Convert day of year to date
  const date = new Date(fullYear, 0); // January 1st
  date.setDate(dayOfYear); // Set to day of year

  return date;
}

/**
 * Additional utility to format dates consistently
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "N/A";

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

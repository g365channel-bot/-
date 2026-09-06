/**
 * Buddhist Era (พ.ศ.) Year Utilities
 * Dynamically computes Buddhist years based on the current calendar year.
 */

// Current Buddhist Year (e.g., 2026 -> 2569, 2027 -> 2570)
export const currentBuddhistYear: number = new Date().getFullYear() + 543;

export function getCurrentBuddhistYear(): number {
  return new Date().getFullYear() + 543;
}

/**
 * Returns dynamic year options for health entry:
 * - The newest selectable health-entry year is currentBuddhistYear (prevents accidental future-year entry).
 * - Includes current year plus at least minYearsBack (default 4, e.g., 2570, 2569, 2568, 2567, 2566).
 * - Keeps existing historical years from records selectable and readable.
 * - Sorted descending.
 */
export function getHealthEntryYearOptions(
  existingYears: number[] = [],
  minYearsBack: number = 4
): number[] {
  const current = getCurrentBuddhistYear();
  const set = new Set<number>();

  // Current year + past years
  for (let i = 0; i <= minYearsBack; i++) {
    set.add(current - i);
  }

  // Include any historical years that actually exist (excluding future years)
  for (const yr of existingYears) {
    if (typeof yr === 'number' && !isNaN(yr) && yr <= current && yr >= 2500) {
      set.add(yr);
    }
  }

  return Array.from(set).sort((a, b) => b - a);
}

/**
 * Returns dynamic year options for dashboards, reports, and filters:
 * - Includes current year plus at least minYearsBack.
 * - Always includes any historical years that actually exist in healthChecks data,
 *   even if older than the default range.
 * - Sorted descending.
 */
export function getFilterYearOptions(
  existingYears: number[] = [],
  minYearsBack: number = 4
): number[] {
  const current = getCurrentBuddhistYear();
  const set = new Set<number>();

  // Default range: current year + previous 4 years
  for (let i = 0; i <= minYearsBack; i++) {
    set.add(current - i);
  }

  // Historical years from data
  for (const yr of existingYears) {
    if (typeof yr === 'number' && !isNaN(yr) && yr >= 2500) {
      set.add(yr);
    }
  }

  return Array.from(set).sort((a, b) => b - a);
}

/**
 * Formats a Buddhist year for display in dropdowns
 * e.g., "พ.ศ. 2570 (ปีปัจจุบัน)" or "พ.ศ. 2569"
 */
export function formatBuddhistYearLabel(year: number, prefix: string = 'พ.ศ.'): string {
  const current = getCurrentBuddhistYear();
  if (year === current) {
    return `${prefix} ${year} (ปีปัจจุบัน)`;
  }
  return `${prefix} ${year}`;
}

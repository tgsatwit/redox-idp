import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a duration in days to a human-readable string
 * @param days The duration in days
 * @returns A formatted string representation of the duration
 */
export function formatDuration(days: number): string {
  if (!days || isNaN(days)) return 'N/A';
  
  const years = Math.floor(days / 365);
  const remainingDays = Math.round(days % 365);
  
  if (years === 0) {
    return `${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  } else if (remainingDays === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  }
}

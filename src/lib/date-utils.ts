/**
 * Date utilities for Logic Looper
 * Handles timezone-safe date operations, streak calculations, and daily resets
 */

import { format, parseISO, differenceInDays, isToday, isBefore, isAfter, startOfDay, addDays } from 'date-fns';

/**
 * Get current date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(yesterday, 'yyyy-MM-dd');
}

/**
 * Check if a date string is today
 */
export function isDateToday(dateString: string): boolean {
    try {
        const date = parseISO(dateString);
        return isToday(date);
    } catch {
        return false;
    }
}

/**
 * Check if a date string is in the past
 */
export function isDateInPast(dateString: string): boolean {
    try {
        const date = parseISO(dateString);
        const today = startOfDay(new Date());
        return isBefore(startOfDay(date), today);
    } catch {
        return false;
    }
}

/**
 * Check if a date string is in the future
 */
export function isDateInFuture(dateString: string): boolean {
    try {
        const date = parseISO(dateString);
        const today = startOfDay(new Date());
        return isAfter(startOfDay(date), today);
    } catch {
        return false;
    }
}

/**
 * Get number of days between two dates
 */
export function getDaysBetween(date1: string, date2: string): number {
    try {
        const d1 = parseISO(date1);
        const d2 = parseISO(date2);
        return Math.abs(differenceInDays(d1, d2));
    } catch {
        return 0;
    }
}

/**
 * Calculate streak from sorted array of completed dates
 * Returns current streak count
 */
export function calculateStreak(completedDates: string[]): number {
    if (completedDates.length === 0) return 0;

    // Sort dates in descending order (most recent first)
    const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Streak must include today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
        return 0; // Streak broken
    }

    let streak = 0;
    let expectedDate = sortedDates[0] === today ? today : yesterday;

    for (const date of sortedDates) {
        if (date === expectedDate) {
            streak++;
            // Move to previous day
            const prevDate = new Date(expectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            expectedDate = format(prevDate, 'yyyy-MM-dd');
        } else {
            // Gap found, streak ends
            break;
        }
    }

    return streak;
}

/**
 * Check if streak is still active (played today or yesterday)
 */
export function isStreakActive(lastPlayedDate: string): boolean {
    if (!lastPlayedDate) return false;

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    return lastPlayedDate === today || lastPlayedDate === yesterday;
}

/**
 * Get all dates in current year for heatmap
 */
export function getDatesInYear(year?: number): string[] {
    const targetYear = year || new Date().getFullYear();
    const dates: string[] = [];

    const startDate = new Date(targetYear, 0, 1); // January 1st
    const endDate = new Date(targetYear, 11, 31); // December 31st

    let currentDate = startDate;
    while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
    }

    return dates;
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get expected number of days in a year
 */
export function getDaysInYear(year: number): number {
    return isLeapYear(year) ? 366 : 365;
}

/**
 * Format date for display (e.g., "January 15, 2026")
 */
export function formatDateForDisplay(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMMM d, yyyy');
    } catch {
        return dateString;
    }
}

/**
 * Format date as relative (e.g., "Today", "Yesterday", "2 days ago")
 */
export function formatDateRelative(dateString: string): string {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';

    const daysAgo = getDaysBetween(dateString, today);
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
    return `${Math.floor(daysAgo / 365)} years ago`;
}

/**
 * Check if puzzle should be locked (future date or past incomplete)
 */
export function isPuzzleLocked(dateString: string, isCompleted: boolean): boolean {
    // Future puzzles are always locked
    if (isDateInFuture(dateString)) return true;

    // Today's puzzle is never locked
    if (isDateToday(dateString)) return false;

    // Past puzzles are locked if not completed
    return !isCompleted;
}

/**
 * Get puzzle unlock status message
 */
export function getPuzzleUnlockMessage(dateString: string, isCompleted: boolean): string {
    if (isDateInFuture(dateString)) {
        return 'This puzzle will unlock on ' + formatDateForDisplay(dateString);
    }

    if (isDateToday(dateString)) {
        return 'Today\'s puzzle';
    }

    if (isCompleted) {
        return 'Completed on ' + formatDateForDisplay(dateString);
    }

    return 'You missed this puzzle';
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    try {
        const date = parseISO(dateString);
        return !isNaN(date.getTime());
    } catch {
        return false;
    }
}

/**
 * Get start of week (Monday) for a given date
 */
export function getStartOfWeek(dateString: string): string {
    try {
        const date = parseISO(dateString);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(date.setDate(diff));
        return format(monday, 'yyyy-MM-dd');
    } catch {
        return dateString;
    }
}

/**
 * Check if two dates are consecutive days
 */
export function areConsecutiveDays(date1: string, date2: string): boolean {
    return getDaysBetween(date1, date2) === 1;
}

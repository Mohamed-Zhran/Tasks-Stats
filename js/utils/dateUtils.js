/**
 * Date utility functions for parsing, formatting, and manipulation
 * All date operations use local timezone to avoid conversion issues
 */

/**
 * Parse ISO date string to local Date object
 * @param {string} isoString - ISO date string (e.g., "2024-01-15T10:30:00Z" or "2024-01-15")
 * @returns {Date|null} Local Date object or null if invalid
 */
export function parseISODate(isoString) {
    if (!isoString) return null;

    const datePart = isoString.split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) return null;

    const date = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
    );

    return isNaN(date.getTime()) ? null : date;
}

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * @param {Date} date - Date object to format
 * @returns {string} ISO date string
 */
export function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

/**
 * Get start of day (midnight) for a date
 * @param {Date} date - Date object
 * @returns {Date} Date set to start of day
 */
export function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setMilliseconds(0);
    return result;
}

/**
 * Get end of day (23:59:59.999) for a date
 * @param {Date} date - Date object
 * @returns {Date} Date set to end of day
 */
export function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Add days to a date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date object
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Check if date is within range (inclusive)
 * @param {Date} date - Date to check
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {boolean} True if date is in range
 */
export function isDateInRange(date, startDate, endDate) {
    const time = date.getTime();
    return time >= startDate.getTime() && time <= endDate.getTime();
}

/**
 * Get date range for last N days
 * @param {number} days - Number of days
 * @returns {{start: Date, end: Date}} Date range object
 */
export function getLastNDaysRange(days) {
    const end = new Date();
    const start = addDays(end, -days + 1);
    return { start, end };
}

/**
 * Get today's date range
 * @returns {{start: Date, end: Date}} Today's date range
 */
export function getTodayRange() {
    const today = new Date();
    return { start: today, end: today };
}

/**
 * Get yesterday's date range
 * @returns {{start: Date, end: Date}} Yesterday's date range
 */
export function getYesterdayRange() {
    const yesterday = addDays(new Date(), -1);
    return { start: yesterday, end: yesterday };
}

/**
 * Format date for display (e.g., "Mon, Jan 15, 2024")
 * @param {Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDisplayDate(date, options = {}) {
    const defaultOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format date with time (e.g., "Mon, Jan 15, 2:30 PM")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get full date format (e.g., "Monday, January 15, 2024")
 * @param {Date} date - Date to format
 * @returns {string} Full date string
 */
export function formatFullDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Check if date is yesterday
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export function isYesterday(date) {
    const yesterday = addDays(new Date(), -1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
}

/**
 * Get days between two dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {number} Number of days
 */
export function getDaysBetween(start, end) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Validate date object
 * @param {any} date - Value to validate
 * @returns {boolean} True if valid date
 */
export function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

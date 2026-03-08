/**
 * Generic helper functions used throughout the application
 */

/**
 * Create a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create a throttled version of a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate a consistent color from a string
 * @param {string} str - Input string
 * @returns {{bg: string, border: string}} Color object
 */
export function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return {
        bg: `hsla(${hue}, 70%, 60%, 0.8)`,
        border: `hsla(${hue}, 70%, 50%, 1)`
    };
}

/**
 * Get color for a task name from predefined colors or generate one
 * @param {string} taskName - Task name
 * @param {Object} predefinedColors - Predefined color mappings
 * @returns {{bg: string, border: string}} Color object
 */
export function getTaskColor(taskName, predefinedColors = {}) {
    if (predefinedColors[taskName]) {
        return predefinedColors[taskName];
    }
    return generateColor(taskName);
}

/**
 * Safely parse JSON without throwing errors
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed JSON or default value
 */
export function safeJSONParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue;
    }
}

/**
 * Check if value is a non-empty string
 * @param {any} value - Value to check
 * @returns {boolean} True if non-empty string
 */
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid object (not null, not array)
 * @param {any} value - Value to check
 * @returns {boolean} True if valid object
 */
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (!isObject(obj)) return obj;
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Get nested property from object safely
 * @param {Object} obj - Object to query
 * @param {string} path - Dot-separated path (e.g., "user.address.city")
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Property value or default
 */
export function getProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result == null || !(key in result)) {
            return defaultValue;
        }
        result = result[key];
    }

    return result;
}

/**
 * Group array items by a property
 * @param {Array} array - Array to group
 * @param {string|Function} key - Property name or function to get key
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Count occurrences of values in array
 * @param {Array} array - Array to count
 * @param {string|Function} key - Property name or function to get key
 * @returns {Object} Count object
 */
export function countBy(array, key) {
    return array.reduce((result, item) => {
        const countKey = typeof key === 'function' ? key(item) : item[key];
        result[countKey] = (result[countKey] || 0) + 1;
        return result;
    }, {});
}

/**
 * Remove duplicates from array
 * @param {Array} array - Array to deduplicate
 * @param {Function} [keyFn] - Optional function to get unique key
 * @returns {Array} Deduplicated array
 */
export function unique(array, keyFn) {
    if (!keyFn) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Sort array by property
 * @param {Array} array - Array to sort
 * @param {string|Function} key - Property name or function to get key
 * @param {string} [order='asc'] - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export function sortBy(array, key, order = 'asc') {
    const multiplier = order === 'desc' ? -1 : 1;

    return [...array].sort((a, b) => {
        const aKey = typeof key === 'function' ? key(a) : a[key];
        const bKey = typeof key === 'function' ? key(b) : b[key];

        if (aKey < bKey) return -1 * multiplier;
        if (aKey > bKey) return 1 * multiplier;
        return 0;
    });
}

/**
 * Format number with locale
 * @param {number} num - Number to format
 * @param {string} [locale='en-US'] - Locale string
 * @returns {string} Formatted number
 */
export function formatNumber(num, locale = 'en-US') {
    return num.toLocaleString(locale);
}

/**
 * Calculate average of array values
 * @param {Array<number>} array - Array of numbers
 * @param {number} [decimals=1] - Decimal places
 * @returns {number} Average value
 */
export function average(array, decimals = 1) {
    if (!array || array.length === 0) return 0;
    const sum = array.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / array.length).toFixed(decimals));
}

/**
 * Find max value in array by property
 * @param {Array} array - Array to search
 * @param {string|Function} key - Property name or function
 * @returns {any} Max value
 */
export function maxBy(array, key) {
    if (!array || array.length === 0) return undefined;

    const getValue = typeof key === 'function' ? key : (item) => item[key];
    return array.reduce((max, item) => getValue(item) > getValue(max) ? item : max);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} [baseDelay=1000] - Base delay in ms
 * @returns {Promise<any>} Function result
 */
export async function retry(fn, maxRetries, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = baseDelay * Math.pow(2, i);
            await sleep(delay);
        }
    }
}

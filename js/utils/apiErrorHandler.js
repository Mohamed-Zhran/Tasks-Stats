/**
 * API Error Handler
 * Handles HTTP errors from API responses, including automatic signout on 401
 */

import { googleAuth } from '../auth/googleAuth.js';

/**
 * Handle API response errors
 * @param {Response} response - Fetch API response object
 * @returns {Error} Error object with appropriate message
 */
export function handleApiError(response) {
    if (response.status === 401) {
        googleAuth.signOut();
        return new Error('Session expired. Please sign in again.');
    }

    if (response.status === 403) {
        return new Error('Access denied. Insufficient permissions.');
    }

    if (response.status >= 500) {
        return new Error('Server error. Please try again later.');
    }

    return new Error(`Request failed with status ${response.status}`);
}

/**
 * Google Calendar API Wrapper
 * Handles all interactions with the Google Calendar API
 */

import { config, CALENDAR_COLORS } from '../config.js';
import { parseISODate, addDays } from '../utils/dateUtils.js';
import { retry } from '../utils/helpers.js';
import { handleApiError } from '../utils/apiErrorHandler.js';

class CalendarAPI {
    constructor() {
        this.maxRetries = 3;
        this.baseDelay = 1000;
    }

    /**
     * Fetch all calendars for the authenticated user
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Array>} Array of calendar objects
     */
    async fetchCalendarList(accessToken) {
        try {
            const response = await this._makeRequest(
                `${config.api.calendarBase}/users/me/calendarList`,
                accessToken
            );

            // Filter to calendars we can read
            return (response.items || []).filter(cal => cal.accessRole !== 'none');
        } catch (error) {
            return [];
        }
    }

    /**
     * Fetch events from a specific calendar
     * @param {string} calendarId - Calendar ID
     * @param {string} accessToken - Google OAuth2 access token
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of calendar events
     */
    async fetchCalendarEvents(calendarId, accessToken, options = {}) {
        const {
            timeMin = addDays(new Date(), -config.ui.maxCalendarDays),
            timeMax = addDays(new Date(), config.ui.futureCalendarDays),
            maxResults = 2500
        } = options;

        try {
            const url = new URL(
                `${config.api.calendarBase}/calendars/${encodeURIComponent(calendarId)}/events`
            );

            url.searchParams.set('timeMin', timeMin.toISOString());
            url.searchParams.set('timeMax', timeMax.toISOString());
            url.searchParams.set('maxResults', maxResults.toString());
            url.searchParams.set('singleEvents', 'true');
            url.searchParams.set('orderBy', 'startTime');

            const response = await this._makeRequest(url.toString(), accessToken);
            return response.items || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Fetch events from all calendars
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Array>} Array of all calendar events with calendar info
     */
    async fetchAllEvents(accessToken) {
        try {
            const calendars = await this.fetchCalendarList(accessToken);
            const allEvents = [];

            for (const calendar of calendars) {
                const events = await this.fetchCalendarEvents(calendar.id, accessToken);

                // Tag events with calendar info
                events.forEach(event => {
                    event.calendarName = calendar.summary;
                    event.calendarId = calendar.id;
                });

                allEvents.push(...events);
            }

            return allEvents;
        } catch (error) {
            return [];
        }
    }

    /**
     * Process calendar events and filter by task status colors
     * @param {Array} events - Calendar events to process
     * @returns {{completed: Array, uncompleted: Array}} Processed tasks
     */
    processEvents(events) {
        const completed = [];
        const uncompleted = [];

        const STORAGE_PREFIX = 'task_original_color_';

        for (const event of events) {
            const title = event.summary;
            if (!title) continue;

            // Skip cancelled or deleted events
            if (event.status === 'cancelled' || event.deleted === true) {
                continue;
            }

            // Filter by color: Sage (2) = completed, all other colors = uncompleted
            const colorId = event.colorId;
            if (!colorId) {
                continue;
            }

            const taskDate = event.start?.dateTime || event.start?.date;
            if (!taskDate) {
                continue;
            }

            const eventDate = parseISODate(taskDate);
            if (!eventDate) {
                continue;
            }

            const datePart = taskDate.split('T')[0];

            // For uncompleted tasks, their current color is their original color
            // For completed tasks, we'll check localStorage below
            let originalColorId = colorId;

            const taskData = {
                title: title,
                id: event.id,
                color: config.calendar.eventColors[colorId] || '#546e7a',
                colorId: colorId,
                list: event.calendarName || 'Google Calendar',
                calendarId: event.calendarId,
                eventId: event.id,
                htmlLink: event.htmlLink,
                completed_date: eventDate,
                completion_date: datePart,
                source: 'calendar',
                originalColorId: originalColorId
            };

            if (colorId === CALENDAR_COLORS.SAGE) {
                // For completed tasks, check localStorage for the original color before completion
                try {
                    const storedColor = localStorage.getItem(STORAGE_PREFIX + event.id);
                    if (storedColor) {
                        taskData.originalColorId = storedColor;
                    }
                } catch (e) {
                    // Ignore localStorage errors
                }
                completed.push(taskData);
            } else {
                taskData.status = config.taskStatus.needsAction;
                taskData.due = taskDate;
                uncompleted.push(taskData);
            }
        }

        return { completed, uncompleted };
    }

    /**
     * Update event color (for marking tasks as completed/uncompleted)
     * @param {string} calendarId - Calendar ID
     * @param {string} eventId - Event ID
     * @param {string} colorId - New color ID
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Object>} Updated event
     */
    async updateEventColor(calendarId, eventId, colorId, accessToken) {
        try {
            const url = `${config.api.calendarBase}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
            
            const response = await this._makeRequest(
                url,
                accessToken,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        colorId: colorId
                    })
                }
            );

            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Make authenticated API request with retry logic
     * @param {string} url - API endpoint URL
     * @param {string} accessToken - Google OAuth2 access token
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     * @private
     */
    async _makeRequest(url, accessToken, options = {}) {
        return retry(
            async () => {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!response.ok) {
                    throw handleApiError(response);
                }

                return response.json();
            },
            this.maxRetries,
            this.baseDelay
        );
    }
}

// Export singleton instance
export const calendarApi = new CalendarAPI();

/**
 * Google Tasks API Wrapper
 * Handles all interactions with the Google Tasks API
 */

import { config } from '../config.js';
import { retry } from '../utils/helpers.js';
import { handleApiError } from '../utils/apiErrorHandler.js';

class TasksAPI {
    constructor() {
        this.maxRetries = 3;
        this.baseDelay = 1000;
    }

    /**
     * Fetch all task lists for the authenticated user
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Array>} Array of task lists
     */
    async fetchTaskLists(accessToken) {
        try {
            const response = await this._makeRequest(
                `${config.api.tasksBase}/users/@me/lists`,
                accessToken
            );
            return response.items || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Fetch all tasks from a specific task list
     * @param {string} listId - Task list ID
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Array>} Array of tasks
     */
    async fetchTasksFromList(listId, accessToken) {
        const tasks = [];
        let nextPageToken = null;

        try {
            do {
                const url = new URL(`${config.api.tasksBase}/lists/${listId}/tasks`);

                if (nextPageToken) {
                    url.searchParams.set('pageToken', nextPageToken);
                }

                url.searchParams.set('showCompleted', 'true');
                url.searchParams.set('showDeleted', 'false');
                url.searchParams.set('showHidden', 'true');

                const response = await this._makeRequest(url.toString(), accessToken);

                tasks.push(...(response.items || []));
                nextPageToken = response.nextPageToken;

            } while (nextPageToken);

            return tasks;
        } catch (error) {
            return [];
        }
    }

    /**
     * Fetch tasks from all lists
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Array>} Array of task list objects with tasks
     */
    async fetchAllTasks(accessToken) {
        try {
            const taskLists = await this.fetchTaskLists(accessToken);
            const allData = { items: [] };

            for (const list of taskLists) {
                const tasks = await this.fetchTasksFromList(list.id, accessToken);
                allData.items.push({
                    title: list.title,
                    id: list.id,
                    items: tasks
                });
            }

            return allData;
        } catch (error) {
            return { items: [] };
        }
    }

    /**
     * Make authenticated API request with retry logic
     * @param {string} url - API endpoint URL
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<Object>} API response
     * @private
     */
    async _makeRequest(url, accessToken) {
        return retry(
            async () => {
                const response = await fetch(url, {
                    headers: {
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
export const tasksApi = new TasksAPI();

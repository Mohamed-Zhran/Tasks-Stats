/**
 * Task Toggle Service
 * Handles toggling task completion status by updating calendar event colors
 */

import { calendarApi } from '../api/calendarApi.js';
import { config, CALENDAR_COLORS } from '../config.js';

const STORAGE_PREFIX = 'task_original_color_';

class TaskToggleService {
    constructor() {
        this.pendingUpdates = new Map();
    }

    /**
     * Store original color for a task
     * @param {string} taskId - Task/event ID
     * @param {string} colorId - Color ID to store
     */
    _storeOriginalColor(taskId, colorId) {
        try {
            localStorage.setItem(STORAGE_PREFIX + taskId, colorId);
        } catch (e) {
            console.warn('Failed to store original color:', e);
        }
    }

    /**
     * Get stored original color for a task
     * @param {string} taskId - Task/event ID
     * @returns {string|null} Stored color ID or null
     */
    _getOriginalColor(taskId) {
        try {
            return localStorage.getItem(STORAGE_PREFIX + taskId);
        } catch (e) {
            console.warn('Failed to get original color:', e);
            return null;
        }
    }

    /**
     * Clear stored original color for a task
     * @param {string} taskId - Task/event ID
     */
    _clearOriginalColor(taskId) {
        try {
            localStorage.removeItem(STORAGE_PREFIX + taskId);
        } catch (e) {
            console.warn('Failed to clear original color:', e);
        }
    }

    /**
     * Toggle task completion status
     * @param {Object} task - Task object
     * @param {boolean} isCurrentlyCompleted - Current completion status
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<{success: boolean, task: Object, newStatus: string}>} Result
     */
    async toggleTaskCompletion(task, isCurrentlyCompleted, accessToken) {
        const taskId = task.eventId || task.id;
        const calendarId = task.calendarId;

        if (!calendarId || !taskId) {
            throw new Error('Cannot toggle task: missing calendar or event ID');
        }

        let newColorId;

        if (isCurrentlyCompleted) {
            // Marking as uncompleted: use stored originalColorId (from localStorage via processEvents)
            newColorId = task.originalColorId || '8';
        } else {
            // Marking as completed: store current color, then use Sage
            const currentColorId = task.originalColorId || task.colorId || '8';
            this._storeOriginalColor(taskId, currentColorId);
            newColorId = CALENDAR_COLORS.SAGE;
        }

        const newStatus = !isCurrentlyCompleted;

        try {
            await calendarApi.updateEventColor(calendarId, taskId, newColorId, accessToken);

            // Clear stored color after successfully reverting to uncompleted
            if (isCurrentlyCompleted) {
                this._clearOriginalColor(taskId);
            }

            return {
                success: true,
                task: task,
                newStatus: newStatus,
                newColorId: newColorId
            };
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
            return {
                success: false,
                task: task,
                error: error.message
            };
        }
    }

    /**
     * Toggle task with optimistic UI update
     * @param {Object} task - Task object
     * @param {boolean} isCurrentlyCompleted - Current completion status
     * @param {Function} onOptimisticUpdate - Callback to update UI optimistically
     * @param {Function} onRollback - Callback to rollback on failure
     * @param {string} accessToken - Google OAuth2 access token
     * @returns {Promise<{success: boolean, task: Object, newStatus: string}>} Result
     */
    async toggleWithOptimisticUpdate(
        task,
        isCurrentlyCompleted,
        onOptimisticUpdate,
        onRollback,
        accessToken
    ) {
        const taskId = task.eventId || task.id;

        if (this.pendingUpdates.has(taskId)) {
            return { success: false, error: 'Update already in progress' };
        }

        this.pendingUpdates.set(taskId, true);

        const newStatus = !isCurrentlyCompleted;

        onOptimisticUpdate(task, newStatus);

        const result = await this.toggleTaskCompletion(task, isCurrentlyCompleted, accessToken);

        this.pendingUpdates.delete(taskId);

        if (!result.success) {
            onRollback(task, isCurrentlyCompleted);
        }

        return result;
    }

    /**
     * Check if task update is in progress
     * @param {string} taskId - Task ID
     * @returns {boolean} True if update is pending
     */
    isUpdatePending(taskId) {
        return this.pendingUpdates.has(taskId);
    }
}

export const taskToggleService = new TaskToggleService();

/**
 * State Manager
 * Centralized application state management with observer pattern
 */

import { addDays } from '../utils/dateUtils.js';

class StateManager {
    constructor() {
        this.state = {
            // Task data
            completedTasks: [],
            uncompletedTasks: [],
            tasksByTitle: {},
            lists: [],
            calendars: [],

            // Date range
            dateRange: {
                min: null,
                max: null
            },

            // Current filters
            filters: {
                startDate: null,
                endDate: null,
                listName: 'all',
                taskName: 'all'
            },

            // UI state
            isLoading: false,
            error: null,
            isAuthenticated: false,
            userInfo: null,
            activePreset: 'all'
        };

        this.listeners = new Map();
        this.debounceDelay = 300;
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to observe
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * Notify listeners of state change
     * @param {string} key - Changed state key
     * @param {any} value - New value
     * @private
     */
    _notify(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value, this.state));
        }
    }

    /**
     * Update state and notify listeners
     * @param {string} key - State key
     * @param {any} value - New value
     */
    setState(key, value) {
        this.state[key] = value;
        this._notify(key, value);
    }

    /**
     * Update nested state
     * @param {string} parentKey - Parent state key
     * @param {string} childKey - Child state key
     * @param {any} value - New value
     */
    setNestedState(parentKey, childKey, value) {
        if (!this.state[parentKey] || typeof this.state[parentKey] !== 'object') {
            this.state[parentKey] = {};
        }
        this.state[parentKey][childKey] = value;
        this._notify(`${parentKey}.${childKey}`, value);
        this._notify(parentKey, this.state[parentKey]);
    }

    /**
     * Get state value
     * @param {string} key - State key
     * @returns {any} State value
     */
    getState(key) {
        return this.state[key];
    }

    /**
     * Get nested state value
     * @param {string} parentKey - Parent state key
     * @param {string} childKey - Child state key
     * @returns {any} State value
     */
    getNestedState(parentKey, childKey) {
        return this.state[parentKey]?.[childKey];
    }

    /**
     * Get entire state
     * @returns {Object} Current state
     */
    getFullState() {
        return { ...this.state };
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading status
     */
    setLoading(isLoading) {
        this.setNestedState('ui', 'isLoading', isLoading);
        this.state.isLoading = isLoading;
        this._notify('isLoading', isLoading);
    }

    /**
     * Set error state
     * @param {string|null} error - Error message
     */
    setError(error) {
        this.state.error = error;
        this._notify('error', error);
    }

    /**
     * Clear error state
     */
    clearError() {
        this.setError(null);
    }

    /**
     * Set authentication state
     * @param {boolean} isAuthenticated - Auth status
     * @param {Object} userInfo - User info object
     */
    setAuthState(isAuthenticated, userInfo = null) {
        this.state.isAuthenticated = isAuthenticated;
        this.state.userInfo = userInfo;
        this._notify('isAuthenticated', isAuthenticated);
        this._notify('userInfo', userInfo);
    }

    /**
     * Get access token
     * @returns {string|null} Access token
     */
    getAccessToken() {
        const tokenInfo = localStorage.getItem('google_access_token');
        if (!tokenInfo) return null;
        
        try {
            const token = JSON.parse(tokenInfo);
            return token.access_token || token;
        } catch {
            return tokenInfo;
        }
    }

    /**
     * Set task data
     * @param {Object} taskData - Task data object
     */
    setTaskData(taskData) {
        const { completed, uncompleted, byTitle, lists, calendars } = taskData;

        this.state.completedTasks = completed || [];
        this.state.uncompletedTasks = uncompleted || [];
        this.state.tasksByTitle = byTitle || {};
        this.state.lists = lists || [];
        this.state.calendars = calendars || [];

        this._notify('completedTasks', this.state.completedTasks);
        this._notify('uncompletedTasks', this.state.uncompletedTasks);
        this._notify('tasksByTitle', this.state.tasksByTitle);
        this._notify('lists', this.state.lists);
        this._notify('calendars', this.state.calendars);
    }

    /**
     * Set date range from tasks
     * @param {Date} min - Minimum date
     * @param {Date} max - Maximum date
     */
    setDateRange(min, max) {
        this.state.dateRange = { min, max };
        this._notify('dateRange', this.state.dateRange);
    }

    /**
     * Set filter values
     * @param {Object} filters - Filter values
     */
    setFilters(filters) {
        this.state.filters = { ...this.state.filters, ...filters };
        this._notify('filters', this.state.filters);
    }

    /**
     * Reset filters to default
     */
    resetFilters() {
        this.state.filters = {
            startDate: this.state.dateRange.min,
            endDate: this.state.dateRange.max,
            listName: 'all',
            taskName: 'all'
        };
        this._notify('filters', this.state.filters);
    }

    /**
     * Set active preset button
     * @param {string} preset - Preset name
     */
    setActivePreset(preset) {
        this.state.activePreset = preset;
        this._notify('activePreset', preset);
    }

    /**
     * Set all-time date range
     */
    setAllTimeRange() {
        const { min, max } = this.state.dateRange;
        if (!min || !max) return;

        this.setFilters({
            startDate: min,
            endDate: max
        });
        this.setActivePreset('all');
    }

    /**
     * Set last N days range
     * @param {number} days - Number of days
     */
    setLastNDaysRange(days) {
        const endDate = new Date();
        const startDate = addDays(endDate, -days + 1);

        this.setFilters({
            startDate,
            endDate
        });
        this.setActivePreset(days.toString());
    }

    /**
     * Set today's range
     */
    setTodayRange() {
        const today = new Date();
        this.setFilters({
            startDate: today,
            endDate: today
        });
        this.setActivePreset('today');
    }

    /**
     * Set yesterday's range
     */
    setYesterdayRange() {
        const yesterday = addDays(new Date(), -1);
        this.setFilters({
            startDate: yesterday,
            endDate: yesterday
        });
        this.setActivePreset('yesterday');
    }

    /**
     * Get current filters
     * @returns {Object} Current filters
     */
    getFilters() {
        return { ...this.state.filters };
    }

    /**
     * Get filtered tasks
     * @returns {Array} Filtered completed tasks
     */
    getFilteredTasks() {
        const { startDate, endDate, listName, taskName } = this.state.filters;

        return this.state.completedTasks.filter(task => {
            const taskDate = task.completed_date;
            if (!taskDate || taskDate < startDate || taskDate > endDate) {
                return false;
            }
            if (listName !== 'all' && task.list !== listName) {
                return false;
            }
            if (taskName !== 'all' && task.title !== taskName) {
                return false;
            }
            return true;
        });
    }

    /**
     * Clear all task data
     */
    clearTaskData() {
        this.state.completedTasks = [];
        this.state.uncompletedTasks = [];
        this.state.tasksByTitle = {};
        this.state.lists = [];
        this.state.calendars = [];
        this.state.dateRange = { min: null, max: null };

        this._notify('completedTasks', []);
        this._notify('uncompletedTasks', []);
        this._notify('tasksByTitle', {});
        this._notify('lists', []);
        this._notify('calendars', []);
        this._notify('dateRange', { min: null, max: null });
    }

    /**
     * Reset state to initial
     */
    reset() {
        this.state = {
            completedTasks: [],
            uncompletedTasks: [],
            tasksByTitle: {},
            lists: [],
            calendars: [],
            dateRange: { min: null, max: null },
            filters: {
                startDate: null,
                endDate: null,
                listName: 'all',
                taskName: 'all'
            },
            isLoading: false,
            error: null,
            isAuthenticated: false,
            userInfo: null,
            activePreset: 'all'
        };

        this.listeners.forEach((callbacks, key) => {
            callbacks.forEach(callback => callback(null, this.state));
        });
    }
}

// Export singleton instance
export const stateManager = new StateManager();

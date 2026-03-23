/**
 * Daily Task Completion App
 * Main application entry point
 */

import { googleAuth } from './auth/googleAuth.js';
import { tasksApi } from './api/tasksApi.js';
import { calendarApi } from './api/calendarApi.js';
import { taskProcessor } from './services/taskProcessor.js';
import { filterService } from './services/filterService.js';
import { taskToggleService } from './services/taskToggleService.js';
import { stateManager } from './ui/stateManager.js';
import { chartManager } from './ui/chartManager.js';
import {
    showError,
    hideError,
    showLoading,
    hideLoading,
    showDashboard,
    hideDashboard,
    showAuthSuccess,
    hideAuthSuccess,
    updateUserInfo,
    populateSelect,
    updateSummaryStats,
    showTaskDetails,
    hideTaskDetails,
    updateActivePreset,
    addEventListener,
    getElement,
    renderCalendarTasks,
    updateTaskCheckbox
} from './ui/domUtils.js';

class TaskApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    init() {
        if (this.initialized) return;

        this._setupEventListeners();
        this._setupAuthCallbacks();
        this.initialized = true;
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Single date picker
        addEventListener('singleDate', 'change', () => this._handleSingleDateChange());

        // Start date picker
        addEventListener('startDate', 'change', () => this._handleDateChange());

        // End date picker
        addEventListener('endDate', 'change', () => this._handleDateChange());

        // List selector
        addEventListener('listSelector', 'change', (e) => this._handleListChange(e));

        // Task selector
        addEventListener('taskSelector', 'change', () => this._handleTaskChange());

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this._handlePresetClick(btn));
        });

        // Close task details
        addEventListener('closeTaskDetails', 'click', () => hideTaskDetails());

        // Calendar tasks checkbox toggle
        const calendarTaskList = getElement('calendarTaskList');
        if (calendarTaskList) {
            calendarTaskList.addEventListener('change', (e) => this._handleTaskToggle(e));
        }
    }

    /**
     * Set up authentication callbacks
     */
    _setupAuthCallbacks() {
        googleAuth.init({
            onSignIn: (token, userInfo) => this._handleSignIn(token, userInfo),
            onSignOut: () => this._handleSignOut(),
            onError: (error) => this._handleAuthError(error)
        });
    }

    /**
     * Handle successful sign-in
     * @param {string} token - Access token
     * @param {Object} userInfo - User info
     */
    async _handleSignIn(token, userInfo) {
        stateManager.setAuthState(true, userInfo);
        updateUserInfo(userInfo);
        showAuthSuccess();

        await this._loadTasks(token);
    }

    /**
     * Handle sign-out
     */
    _handleSignOut() {
        stateManager.setAuthState(false, null);
        chartManager.destroyAllCharts();
        stateManager.clearTaskData();
        hideDashboard();
        hideAuthSuccess();
        hideError();
    }

    /**
     * Handle authentication error
     * @param {string} error - Error message
     */
    _handleAuthError(error) {
        showError(error);
    }

    /**
     * Load tasks from Google APIs
     * @param {string} token - Access token
     */
    async _loadTasks(token) {
        showLoading();
        hideDashboard();
        hideError();

        try {
            const [tasksData, calendarEvents] = await Promise.all([
                tasksApi.fetchAllTasks(token),
                calendarApi.fetchAllEvents(token)
            ]);

            const calendarTasks = calendarApi.processEvents(calendarEvents);
            const mergedData = taskProcessor.mergeTasks(tasksData, calendarTasks);
            const dateRange = taskProcessor.calculateDateRange(mergedData.completed);

            stateManager.setTaskData({
                ...mergedData,
                calendars: calendarEvents.map(e => e.calendarName).filter((v, i, a) => a.indexOf(v) === i)
            });
            stateManager.setDateRange(dateRange.min, dateRange.max);
            stateManager.resetFilters();

            this._populateSelectors();
            this._updateCharts();

            hideLoading();
            showDashboard();

        } catch (error) {
            showError('Failed to load tasks: ' + error.message);
            hideLoading();
        }
    }

    /**
     * Populate list and task selectors
     */
    _populateSelectors() {
        const state = stateManager.getFullState();

        // Combine calendars and lists, deduplicate
        const allLists = new Set([
            ...state.calendars,
            ...state.lists
        ]);

        const listOptions = Array.from(allLists).map(name => {
            const isCalendar = state.calendars.includes(name);
            return {
                value: name,
                text: isCalendar ? `📅 ${name}` : name
            };
        });

        populateSelect('listSelector', listOptions, 'All Lists (Combined)');

        // Populate task selector
        const taskNames = taskProcessor.getUniqueTaskNames(
            [...state.completedTasks, ...state.uncompletedTasks],
            'all'
        );

        const taskOptions = taskNames.map(name => ({
            value: name,
            text: name
        }));

        populateSelect('taskSelector', taskOptions, 'All Tasks (Combined)');
    }

    /**
     * Handle list selector change
     * @param {Event} e - Change event
     */
    _handleListChange(e) {
        const selectedList = e.target.value;

        // Reset preset buttons
        updateActivePreset('all');
        stateManager.setActivePreset('all');

        // Populate task selector for selected list
        const state = stateManager.getFullState();
        const taskNames = taskProcessor.getUniqueTaskNames(
            [...state.completedTasks, ...state.uncompletedTasks],
            selectedList
        );

        const taskOptions = taskNames.map(name => ({
            value: name,
            text: name
        }));

        populateSelect('taskSelector', taskOptions, 'All Tasks (Combined)');

        // Sync filters and set all-time range
        this._syncFiltersFromDOM();
        stateManager.setAllTimeRange();
        this._updateCharts();
    }

    /**
     * Handle single date picker change
     */
    _handleSingleDateChange() {
        const selectedDate = getElement('singleDate').value;
        if (!selectedDate) return;

        // Reset preset buttons
        updateActivePreset('');
        stateManager.setActivePreset('');

        // Sync list and task selectors, set dates
        this._syncFiltersFromDOM();
        stateManager.setFilters({
            startDate: new Date(selectedDate),
            endDate: new Date(selectedDate)
        });

        this._updateCharts();
    }

    /**
     * Handle date range change (start/end dates)
     */
    _handleDateChange() {
        // Reset preset buttons
        updateActivePreset('');
        stateManager.setActivePreset('');

        // Sync all filters from DOM
        this._syncFiltersFromDOM();
        this._updateCharts();
    }

    /**
     * Handle task selector change
     */
    _handleTaskChange() {
        // Reset preset buttons
        updateActivePreset('');
        stateManager.setActivePreset('');

        // Sync filters and update
        this._syncFiltersFromDOM();
        this._updateCharts();
    }

    /**
     * Handle preset button click
     * @param {HTMLElement} btn - Clicked button
     */
    _handlePresetClick(btn) {
        // Update active state
        updateActivePreset(btn.dataset.days);
        stateManager.setActivePreset(btn.dataset.days);

        // Apply date range
        const days = btn.dataset.days;

        if (days === 'all') {
            stateManager.setAllTimeRange();
        } else if (days === 'today') {
            stateManager.setTodayRange();
        } else if (days === 'yesterday') {
            stateManager.setYesterdayRange();
        } else {
            stateManager.setLastNDaysRange(parseInt(days));
        }

        this._updateCharts();
    }

    /**
     * Sync filter values from DOM to state
     */
    _syncFiltersFromDOM() {
        const startDateEl = getElement('startDate');
        const endDateEl = getElement('endDate');
        const listSelector = getElement('listSelector');
        const taskSelector = getElement('taskSelector');

        const currentFilters = stateManager.getFilters();

        stateManager.setFilters({
            startDate: startDateEl?.value ? new Date(startDateEl.value) : currentFilters.startDate,
            endDate: endDateEl?.value ? new Date(endDateEl.value) : currentFilters.endDate,
            listName: listSelector?.value || 'all',
            taskName: taskSelector?.value || 'all'
        });
    }

    /**
     * Update all charts with current filters
     */
    _updateCharts() {
        const state = stateManager.getFullState();
        const { startDate, endDate, listName, taskName } = state.filters;

        // Filter tasks
        const filteredTasks = filterService.filterTasks(state.completedTasks, {
            startDate,
            endDate,
            listName,
            taskName
        });

        // Prepare daily chart data
        const chartData = filterService.prepareChartData(filteredTasks);

        // Calculate summary stats
        const dailyCounts = filterService.countByDate(filteredTasks);
        const stats = filterService.calculateSummaryStats(filteredTasks, dailyCounts);
        updateSummaryStats(stats);

        // Render daily chart
        chartManager.renderDailyChart(chartData, taskName, (date) => {
            showTaskDetails(date, state.completedTasks, listName, taskName);
        });

        // Update completion status chart
        const statusCounts = filterService.getCompletionStatusCounts(
            state.completedTasks,
            state.uncompletedTasks,
            listName
        );
        chartManager.renderCompletionStatusChart(statusCounts.completed, statusCounts.uncompleted);

        // Update completion rate chart
        const rateData = filterService.getCompletionRateByTask(
            state.tasksByTitle,
            state.completedTasks,
            state.uncompletedTasks,
            listName
        );
        chartManager.renderTaskCompletionRateChart(rateData.labels, rateData.completed, rateData.uncompleted);

        // Render calendar tasks view (with filters applied)
        const filteredCompleted = filterService.filterTasks(state.completedTasks, {
            startDate,
            endDate,
            listName,
            taskName
        });

        const filteredUncompleted = filterService.filterTasks(state.uncompletedTasks, {
            startDate,
            endDate,
            listName,
            taskName
        });

        renderCalendarTasks(
            filteredCompleted,
            filteredUncompleted,
            (task, newStatus) => this._handleTaskUpdate(task, newStatus),
            taskToggleService.pendingUpdates
        );
    }

    /**
     * Handle task toggle from calendar tasks view
     * @param {Event} e - Change event
     */
    _handleTaskToggle(e) {
        const checkbox = e.target;
        if (!checkbox.classList.contains('calendar-task-checkbox')) return;

        const taskId = checkbox.dataset.taskId;
        const isCurrentlyCompleted = checkbox.dataset.isCompleted === 'true';

        const task = this._findTaskById(taskId);
        if (!task) {
            showError('Task not found');
            checkbox.checked = !checkbox.checked;
            return;
        }

        this._toggleTask(task, isCurrentlyCompleted, checkbox);
    }

    /**
     * Find task by ID from current state
     * @param {string} taskId - Task/event ID
     * @returns {Object|null} Task object or null
     */
    _findTaskById(taskId) {
        const state = stateManager.getFullState();
        return state.completedTasks.find(t => (t.eventId || t.id) === taskId) ||
               state.uncompletedTasks.find(t => (t.eventId || t.id) === taskId) ||
               null;
    }

    /**
     * Toggle task completion status
     * @param {Object} task - Task object
     * @param {boolean} isCurrentlyCompleted - Current status
     * @param {HTMLElement} checkbox - Checkbox element
     */
    async _toggleTask(task, isCurrentlyCompleted, checkbox) {
        const accessToken = stateManager.getAccessToken();
        if (!accessToken) {
            showError('Not authenticated. Please sign in again.');
            checkbox.checked = !checkbox.checked;
            return;
        }

        try {
            const result = await taskToggleService.toggleWithOptimisticUpdate(
                task,
                isCurrentlyCompleted,
                (t, newStatus) => this._onOptimisticUpdate(t, newStatus),
                (t, oldStatus) => this._onRollback(t, oldStatus),
                accessToken
            );

            if (result.success) {
                await this._refreshTasks();
            } else {
                showError('Failed to update task: ' + (result.error || 'Unknown error'));
                checkbox.checked = !checkbox.checked;
            }
        } catch (error) {
            showError('Error: ' + error.message);
            checkbox.checked = !checkbox.checked;
        }
    }

    /**
     * Handle optimistic UI update
     * @param {Object} task - Task object
     * @param {boolean} newStatus - New completion status
     */
    _onOptimisticUpdate(task, newStatus) {
        updateTaskCheckbox(task.eventId || task.id, newStatus);
    }

    /**
     * Handle rollback on error
     * @param {Object} task - Task object
     * @param {boolean} oldStatus - Previous completion status
     */
    _onRollback(task, oldStatus) {
        updateTaskCheckbox(task.eventId || task.id, oldStatus);
    }

    /**
     * Refresh tasks after toggle
     */
    async _refreshTasks() {
        const token = stateManager.getAccessToken();
        if (!token) return;

        try {
            const calendarEvents = await calendarApi.fetchAllEvents(token);
            const calendarTasks = calendarApi.processEvents(calendarEvents);
            const tasksData = await tasksApi.fetchAllTasks(token);
            const mergedData = taskProcessor.mergeTasks(tasksData, calendarTasks);

            stateManager.setTaskData({
                ...mergedData,
                calendars: calendarEvents.map(e => e.calendarName).filter((v, i, a) => a.indexOf(v) === i)
            });

            this._updateCharts();
        } catch (error) {
            console.error('Failed to refresh tasks:', error);
        }
    }

    /**
     * Handle task update (placeholder for future use)
     * @param {Object} task - Task object
     * @param {boolean} newStatus - New completion status
     */
    _handleTaskUpdate(task, newStatus) {
        // Placeholder for future task update logic
    }
}

// Create and initialize app instance
const app = new TaskApp();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

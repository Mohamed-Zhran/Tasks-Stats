/**
 * Daily Task Completion App
 * Main application entry point
 */

import { googleAuth } from './auth/googleAuth.js';
import { tasksApi } from './api/tasksApi.js';
import { calendarApi } from './api/calendarApi.js';
import { taskProcessor } from './services/taskProcessor.js';
import { filterService } from './services/filterService.js';
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
    showFileInput,
    updateUserInfo,
    populateSelect,
    updateSummaryStats,
    showTaskDetails,
    hideTaskDetails,
    updateActivePreset,
    addEventListener,
    getElement
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
        // File input
        addEventListener('fileInput', 'change', (e) => this._handleFileSelect(e));

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
     * Handle file upload
     * @param {Event} e - File input change event
     */
    _handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this._processFileData(data);
            } catch (error) {
                showError('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Process uploaded file data
     * @param {Object} data - Parsed JSON data
     */
    _processFileData(data) {
        showLoading();

        try {
            const mergedData = taskProcessor.mergeTasks(data, null);
            const dateRange = taskProcessor.calculateDateRange(mergedData.completed);

            stateManager.setTaskData(mergedData);
            stateManager.setDateRange(dateRange.min, dateRange.max);
            stateManager.resetFilters();

            this._populateSelectors();
            this._updateCharts();

            hideLoading();
            showDashboard();

        } catch (error) {
            showError('Error processing file: ' + error.message);
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

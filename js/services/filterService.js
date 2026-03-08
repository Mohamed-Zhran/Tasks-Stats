/**
 * Filter Service
 * Handles task filtering, data transformation for charts
 */

import { parseISODate, formatDate, formatDisplayDate } from '../utils/dateUtils.js';
import { sortBy } from '../utils/helpers.js';

class FilterService {
    /**
     * Filter completed tasks by date range and criteria
     * @param {Array} tasks - Array of completed tasks
     * @param {Object} filters - Filter criteria
     * @param {Date} filters.startDate - Start date
     * @param {Date} filters.endDate - End date
     * @param {string} filters.listName - List name filter
     * @param {string} filters.taskName - Task name filter
     * @returns {Array} Filtered tasks
     */
    filterTasks(tasks, filters) {
        const { startDate, endDate, listName = 'all', taskName = 'all' } = filters;

        // Convert filter dates to strings for exact comparison (YYYY-MM-DD)
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        return tasks.filter(task => {
            // Use completion_date string for exact date comparison
            const taskDateStr = task.completion_date;
            if (!taskDateStr || taskDateStr < startDateStr || taskDateStr > endDateStr) {
                return false;
            }

            // List filter
            if (listName !== 'all' && task.list !== listName) {
                return false;
            }

            // Task name filter
            if (taskName !== 'all' && task.title !== taskName) {
                return false;
            }

            return true;
        });
    }

    /**
     * Prepare chart data from filtered tasks
     * @param {Array} tasks - Filtered tasks
     * @returns {{labels: Array, data: Array, dates: Array}} Chart data object
     */
    prepareChartData(tasks) {
        const dailyCounts = this.countByDate(tasks);
        const sortedDates = Object.keys(dailyCounts).sort();

        const labels = sortedDates.map(date => {
            const d = parseISODate(date);
            return d ? formatDisplayDate(d, { month: 'short', day: 'numeric', year: 'numeric' }) : date;
        });

        const data = sortedDates.map(date => dailyCounts[date]);

        return {
            labels,
            data,
            dates: sortedDates
        };
    }

    /**
     * Count tasks by completion date
     * @param {Array} tasks - Tasks to count
     * @returns {Object} Daily counts object
     */
    countByDate(tasks) {
        const dailyCounts = {};

        tasks.forEach(task => {
            if (!task.completion_date) return;

            if (!dailyCounts[task.completion_date]) {
                dailyCounts[task.completion_date] = 0;
            }
            dailyCounts[task.completion_date]++;
        });

        return dailyCounts;
    }

    /**
     * Get completion status counts
     * @param {Array} completedTasks - Completed tasks
     * @param {Array} uncompletedTasks - Uncompleted tasks
     * @param {string} listName - Optional list filter
     * @returns {{completed: number, uncompleted: number}} Counts object
     */
    getCompletionStatusCounts(completedTasks, uncompletedTasks, listName = 'all') {
        let completedCount = completedTasks.length;
        let uncompletedCount = uncompletedTasks.length;

        if (listName !== 'all') {
            completedCount = completedTasks.filter(t => t.list === listName).length;
            uncompletedCount = uncompletedTasks.filter(t => t.list === listName).length;
        }

        return { completed: completedCount, uncompleted: uncompletedCount };
    }

    /**
     * Get completion rate by task title
     * @param {Object} tasksByTitle - Tasks grouped by title with counts
     * @param {Array} completedTasks - All completed tasks
     * @param {Array} uncompletedTasks - All uncompleted tasks
     * @param {string} listName - Optional list filter
     * @returns {{labels: Array, completed: Array, uncompleted: Array}} Chart data
     */
    getCompletionRateByTask(tasksByTitle, completedTasks, uncompletedTasks, listName = 'all') {
        const taskTitles = Object.keys(tasksByTitle).sort();
        const labels = [];
        const completedData = [];
        const uncompletedData = [];

        for (const title of taskTitles) {
            const stats = tasksByTitle[title];

            if (listName !== 'all') {
                let listCompleted = 0;
                let listUncompleted = 0;

                completedTasks.forEach(task => {
                    if (task.title === title && task.list === listName) {
                        listCompleted++;
                    }
                });

                uncompletedTasks.forEach(task => {
                    if (task.title === title && task.list === listName) {
                        listUncompleted++;
                    }
                });

                const total = listCompleted + listUncompleted;
                if (total > 0) {
                    labels.push(title);
                    completedData.push(listCompleted);
                    uncompletedData.push(listUncompleted);
                }
            } else {
                const total = stats.completed + stats.uncompleted;
                if (total > 0) {
                    labels.push(title);
                    completedData.push(stats.completed);
                    uncompletedData.push(stats.uncompleted);
                }
            }
        }

        return {
            labels,
            completed: completedData,
            uncompleted: uncompletedData
        };
    }

    /**
     * Get tasks for a specific date (for details view)
     * @param {Array} tasks - All completed tasks
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {string} listName - Optional list filter
     * @param {string} taskName - Optional task name filter
     * @returns {Array} Filtered tasks for date
     */
    getTasksForDate(tasks, date, listName = 'all', taskName = 'all') {
        return tasks.filter(task => {
            if (task.completion_date !== date) return false;
            if (listName !== 'all' && task.list !== listName) return false;
            if (taskName !== 'all' && task.title !== taskName) return false;
            return true;
        });
    }

    /**
     * Calculate summary statistics
     * @param {Array} tasks - Filtered tasks
     * @param {Object} dailyCounts - Daily completion counts
     * @returns {{total: number, avg: number, bestDay: string, bestDayCount: number}} Stats object
     */
    calculateSummaryStats(tasks, dailyCounts) {
        const total = tasks.length;
        const dates = Object.keys(dailyCounts);
        const numDays = dates.length || 1;
        const avg = parseFloat((total / numDays).toFixed(1));

        let bestDay = '-';
        let bestDayCount = 0;

        for (const [date, count] of Object.entries(dailyCounts)) {
            if (count > bestDayCount) {
                bestDayCount = count;
                const dateObj = parseISODate(date);
                if (dateObj) {
                    bestDay = formatDisplayDate(dateObj, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }
        }

        return {
            total,
            avg,
            bestDay,
            bestDayCount
        };
    }
}

// Export singleton instance
export const filterService = new FilterService();

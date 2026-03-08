/**
 * Task Processor Service
 * Handles task extraction, merging, and statistics calculation
 */

import { config, TASK_STATUS } from '../config.js';
import { parseISODate, formatDate } from '../utils/dateUtils.js';
import { isNonEmptyString } from '../utils/helpers.js';

class TaskProcessor {
    /**
     * Extract tasks from Google Tasks API data
     * @param {Object} data - Raw tasks data from API
     * @returns {{completed: Array, uncompleted: Array, byTitle: Object, lists: Array}} Extracted tasks
     */
    extractTasks(data) {
        const completed = [];
        const uncompleted = [];
        const byTitle = {};
        const lists = new Set();


        for (const taskList of data.items || []) {
            const listTitle = taskList.title || 'Untitled List';
            lists.add(listTitle);

            for (const task of taskList.items || []) {
                if (!isNonEmptyString(task.title)) continue;

                const taskData = {
                    title: task.title,
                    status: task.status || TASK_STATUS.NEEDS_ACTION,
                    id: task.id,
                    list: listTitle
                };

                // Initialize task stats
                if (!byTitle[task.title]) {
                    byTitle[task.title] = { completed: 0, uncompleted: 0 };
                }

                // Check if task is completed
                const isCompleted = task.status === TASK_STATUS.COMPLETED;

                if (isCompleted) {
                    const completedTask = this._processCompletedTask(task, taskData, listTitle, taskList.id);

                    if (completedTask) {
                        completed.push(completedTask);
                        byTitle[task.title].completed++;
                    } else {
                        // No valid completion date, count as uncompleted
                        uncompleted.push(taskData);
                        byTitle[task.title].uncompleted++;
                    }
                } else {
                    uncompleted.push(taskData);
                    byTitle[task.title].uncompleted++;
                }
            }
        }


        return {
            completed,
            uncompleted,
            byTitle,
            lists: Array.from(lists).sort()
        };
    }

    /**
     * Process a completed task and extract completion date
     * @param {Object} task - Raw task object
     * @param {Object} taskData - Base task data
     * @param {string} listTitle - Task list title
     * @param {string} listId - Task list ID
     * @returns {Object|null} Processed task or null if invalid
     * @private
     */
    _processCompletedTask(task, taskData, listTitle, listId) {
        let completedDt = null;
        let datePart = null;

        // Try to get completion date from 'completed' field
        if (task.completed) {
            datePart = task.completed.split('T')[0];
            completedDt = parseISODate(task.completed);
        }
        // Fallback to 'updated' field
        else if (task.updated) {
            datePart = task.updated.split('T')[0];
            completedDt = parseISODate(task.updated);
        }

        if (completedDt && datePart) {
            return {
                ...taskData,
                list: listTitle,
                listId: listId,
                taskId: task.id,
                selfLink: task.selfLink,
                completed_date: completedDt,
                completion_date: datePart,
                source: 'tasks'
            };
        }

        return null;
    }

    /**
     * Merge tasks from multiple sources (Tasks API + Calendar API)
     * @param {Object} tasksData - Tasks from Tasks API
     * @param {Object} calendarTasks - Tasks from Calendar API
     * @returns {{completed: Array, uncompleted: Array, byTitle: Object, lists: Array}} Merged tasks
     */
    mergeTasks(tasksData, calendarTasks = null) {
        const extracted = this.extractTasks(tasksData);

        let allCompleted = extracted.completed;
        let allUncompleted = extracted.uncompleted;
        const allByTitle = extracted.byTitle;

        // Merge Calendar tasks
        if (calendarTasks) {
            allCompleted = [...allCompleted, ...calendarTasks.completed];
            allUncompleted = [...allUncompleted, ...calendarTasks.uncompleted];

            // Update byTitle stats for calendar tasks
            calendarTasks.completed.forEach(task => {
                if (!allByTitle[task.title]) {
                    allByTitle[task.title] = { completed: 0, uncompleted: 0 };
                }
                allByTitle[task.title].completed++;
            });

            calendarTasks.uncompleted.forEach(task => {
                if (!allByTitle[task.title]) {
                    allByTitle[task.title] = { completed: 0, uncompleted: 0 };
                }
                allByTitle[task.title].uncompleted++;
            });

        }

        // Add calendar names to lists
        const allLists = new Set(extracted.lists);
        if (calendarTasks) {
            const calendarNames = new Set([
                ...allCompleted.map(t => t.list),
                ...allUncompleted.map(t => t.list)
            ]);
            calendarNames.forEach(name => allLists.add(name));
        }

        return {
            completed: allCompleted,
            uncompleted: allUncompleted,
            byTitle: allByTitle,
            lists: Array.from(allLists).sort()
        };
    }

    /**
     * Calculate date range from completed tasks
     * @param {Array} completedTasks - Array of completed tasks
     * @returns {{min: Date|null, max: Date|null}} Date range
     */
    calculateDateRange(completedTasks) {
        const dates = completedTasks
            .map(t => t.completed_date?.getTime())
            .filter(t => t && !isNaN(t));

        if (dates.length === 0) {
            return { min: null, max: null };
        }

        return {
            min: new Date(Math.min(...dates)),
            max: new Date(Math.max(...dates))
        };
    }

    /**
     * Get unique task names filtered by list
     * @param {Array} allTasks - All tasks (completed + uncompleted)
     * @param {string} listName - List name to filter by
     * @returns {Array} Unique task names
     */
    getUniqueTaskNames(allTasks, listName = 'all') {
        const taskNames = new Set();
        let tasksToFilter = allTasks;

        if (listName === 'Google Calendar') {
            tasksToFilter = tasksToFilter.filter(t => t.list === 'Google Calendar');
        } else if (listName !== 'all') {
            tasksToFilter = tasksToFilter.filter(t => t.list === listName);
        }

        tasksToFilter.forEach(task => taskNames.add(task.title));
        return Array.from(taskNames).sort();
    }

    /**
     * Calculate completion statistics
     * @param {Array} tasks - Array of tasks to analyze
     * @param {Object} dailyCounts - Daily completion counts
     * @returns {{total: number, avg: number, bestDay: string, bestDayCount: number}} Stats object
     */
    calculateStats(tasks, dailyCounts) {
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
                    bestDay = dateObj.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }
        }

        return { total, avg, bestDay, bestDayCount };
    }

    /**
     * Count daily completions from tasks
     * @param {Array} tasks - Completed tasks
     * @returns {Object} Daily counts object
     */
    countDailyCompletions(tasks) {
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
}

// Export singleton instance
export const taskProcessor = new TaskProcessor();

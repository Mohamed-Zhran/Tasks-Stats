/**
 * Chart Manager
 * Handles Chart.js rendering, updates, and cleanup
 */

import { config } from '../config.js';
import { getTaskColor } from '../utils/helpers.js';

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.tooltipConfig = {
            backgroundColor: 'rgba(30, 30, 47, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#2d2d44',
            borderWidth: 1,
            padding: 12
        };

        this.gridConfig = {
            color: 'rgba(45, 45, 68, 0.5)',
            tickColor: '#a0a0a0'
        };
    }

    /**
     * Render or update the daily chart
     * @param {Object} chartData - Chart data object
     * @param {string} selectedTask - Selected task name
     * @param {Function} onChartClick - Click handler
     */
    renderDailyChart(chartData, selectedTask = 'all', onChartClick = null) {
        const { labels, data, dates } = chartData;
        const ctx = this._getContext('dailyChart');
        if (!ctx) return;

        // Destroy existing chart
        this.destroyChart('dailyChart');

        const maxCount = Math.max(...data, 1);
        const colors = this._getBarColors(data, maxCount, selectedTask);

        this.charts.set('dailyChart', new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: selectedTask !== 'all' ? selectedTask : 'Completed Tasks',
                    data,
                    backgroundColor: colors.barColors,
                    borderColor: colors.borderColor,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...this.tooltipConfig,
                        displayColors: false,
                        callbacks: {
                            title: (items) => dates[items[0].dataIndex],
                            label: (context) => `${context.raw} task${context.raw !== 1 ? 's' : ''} completed`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridConfig.color },
                        ticks: {
                            stepSize: 1,
                            color: this.gridConfig.tickColor,
                            callback: (value) => Math.round(value)
                        },
                        title: {
                            display: true,
                            text: 'Number of Tasks',
                            color: this.gridConfig.tickColor
                        }
                    },
                    x: {
                        grid: { color: 'rgba(45, 45, 68, 0.3)' },
                        ticks: {
                            color: this.gridConfig.tickColor,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: this.gridConfig.tickColor
                        }
                    }
                },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0 && onChartClick) {
                        const element = activeElements[0];
                        const dataIndex = element.index;
                        onChartClick(dates[dataIndex]);
                    }
                }
            }
        }));
    }

    /**
     * Render or update the completion status chart
     * @param {number} completed - Completed count
     * @param {number} uncompleted - Uncompleted count
     */
    renderCompletionStatusChart(completed, uncompleted) {
        const ctx = this._getContext('completionStatusChart');
        if (!ctx) return;

        this.destroyChart('completionStatusChart');

        this.charts.set('completionStatusChart', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Uncompleted'],
                datasets: [{
                    data: [completed, uncompleted],
                    backgroundColor: [
                        config.ui.chart.colors.completed,
                        config.ui.chart.colors.uncompleted
                    ],
                    borderColor: [
                        config.ui.chart.colors.completedBorder,
                        config.ui.chart.colors.uncompletedBorder
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw} tasks`
                        }
                    }
                }
            }
        }));
    }

    /**
     * Render or update the task completion rate chart
     * @param {Array} labels - Task labels
     * @param {Array} completedData - Completed counts
     * @param {Array} uncompletedData - Uncompleted counts
     */
    renderTaskCompletionRateChart(labels, completedData, uncompletedData) {
        const ctx = this._getContext('taskCompletionRateChart');
        if (!ctx) return;

        this.destroyChart('taskCompletionRateChart');

        this.charts.set('taskCompletionRateChart', new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Completed',
                        data: completedData,
                        backgroundColor: config.ui.chart.colors.completed,
                        borderColor: config.ui.chart.colors.completedBorder,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Uncompleted',
                        data: uncompletedData,
                        backgroundColor: config.ui.chart.colors.uncompleted,
                        borderColor: config.ui.chart.colors.uncompletedBorder,
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        grid: { color: this.gridConfig.color },
                        ticks: {
                            stepSize: 1,
                            color: this.gridConfig.tickColor
                        },
                        title: {
                            display: true,
                            text: 'Number of Tasks',
                            color: this.gridConfig.tickColor
                        }
                    },
                    x: {
                        stacked: true,
                        grid: { color: 'rgba(45, 45, 68, 0.3)' },
                        ticks: {
                            color: this.gridConfig.tickColor,
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: false
                        }
                    }
                }
            }
        }));
    }

    /**
     * Get bar colors based on count and selected task
     * @param {Array} data - Data values
     * @param {number} maxCount - Maximum count
     * @param {string} selectedTask - Selected task name
     * @returns {{barColors: Array, borderColor: string}} Colors object
     * @private
     */
    _getBarColors(data, maxCount, selectedTask) {
        if (selectedTask && selectedTask !== 'all') {
            const color = getTaskColor(selectedTask, config.ui.chart.taskColors);
            return {
                barColors: data.map(() => color.bg),
                borderColor: color.border
            };
        }

        return {
            barColors: data.map(count => {
                const ratio = count / maxCount;
                if (ratio >= 0.7) return config.ui.chart.colors.primary;
                if (ratio >= 0.4) return config.ui.chart.colors.primaryDark;
                return config.ui.chart.colors.primaryLight;
            }),
            borderColor: 'rgba(102, 126, 234, 1)'
        };
    }

    /**
     * Get canvas 2D context
     * @param {string} canvasId - Canvas element ID
     * @returns {CanvasRenderingContext2D|null} Context
     * @private
     */
    _getContext(canvasId) {
        const canvas = document.getElementById(canvasId);
        return canvas ? canvas.getContext('2d') : null;
    }

    /**
     * Destroy a chart by key
     * @param {string} key - Chart key
     */
    destroyChart(key) {
        const chart = this.charts.get(key);
        if (chart) {
            chart.destroy();
            this.charts.delete(key);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach((chart, key) => {
            chart.destroy();
        });
        this.charts.clear();
    }

    /**
     * Update all charts with new data
     * @param {Object} chartData - Daily chart data
     * @param {string} selectedTask - Selected task
     * @param {number} completed - Completed count
     * @param {number} uncompleted - Uncompleted count
     * @param {Array} rateLabels - Rate chart labels
     * @param {Array} rateCompleted - Rate chart completed data
     * @param {Array} rateUncompleted - Rate chart uncompleted data
     * @param {Function} onChartClick - Daily chart click handler
     */
    updateAllCharts(chartData, selectedTask, completed, uncompleted, rateLabels, rateCompleted, rateUncompleted, onChartClick) {
        this.renderDailyChart(chartData, selectedTask, onChartClick);
        this.renderCompletionStatusChart(completed, uncompleted);
        this.renderTaskCompletionRateChart(rateLabels, rateCompleted, rateUncompleted);
    }
}

// Export singleton instance
export const chartManager = new ChartManager();

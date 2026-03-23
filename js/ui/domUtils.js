/**
 * DOM Utilities
 * Safe and efficient DOM manipulation utilities
 */

import { formatFullDate, formatDateTime } from '../utils/dateUtils.js';

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @param {boolean} required - Throw error if not found
 * @returns {HTMLElement|null} Element
 */
export function getElement(id, required = false) {
    const element = document.getElementById(id);
    if (!element && required) {
        error(`Required element not found: ${id}`);
    }
    return element;
}

/**
 * Safely set text content of an element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} text - Text to set
 */
export function setText(element, text) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.textContent = text;
    }
}

/**
 * Safely set HTML content of an element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} html - HTML to set
 */
export function setHTML(element, html) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.innerHTML = html;
    }
}

/**
 * Toggle visibility of an element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {boolean} show - Show or hide
 */
export function toggleVisibility(element, show) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.style.display = show ? '' : 'none';
    }
}

/**
 * Add class to element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} className - Class to add
 */
export function addClass(element, className) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.classList.add(className);
    }
}

/**
 * Remove class from element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} className - Class to remove
 */
export function removeClass(element, className) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.classList.remove(className);
    }
}

/**
 * Toggle class on element
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add/remove
 */
export function toggleClass(element, className, force = undefined) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.classList.toggle(className, force);
    }
}

/**
 * Set element attribute
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} attr - Attribute name
 * @param {string} value - Attribute value
 */
export function setAttribute(element, attr, value) {
    const el = typeof element === 'string' ? getElement(element) : element;
    if (el) {
        el.setAttribute(attr, value);
    }
}

/**
 * Get element attribute
 * @param {string|HTMLElement} element - Element ID or element
 * @param {string} attr - Attribute name
 * @returns {string|null} Attribute value
 */
export function getAttribute(element, attr) {
    const el = typeof element === 'string' ? getElement(element) : element;
    return el ? el.getAttribute(attr) : null;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
export function showError(message) {
    const errorEl = getElement('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        addClass(errorEl, 'active');
    }
}

/**
 * Hide error message
 */
export function hideError() {
    const errorEl = getElement('errorMessage');
    if (errorEl) {
        removeClass(errorEl, 'active');
    }
}

/**
 * Show loading indicator
 */
export function showLoading() {
    const loadingEl = getElement('loading');
    if (loadingEl) {
        addClass(loadingEl, 'active');
    }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
    const loadingEl = getElement('loading');
    if (loadingEl) {
        removeClass(loadingEl, 'active');
    }
}

/**
 * Show dashboard
 */
export function showDashboard() {
    const dashboard = getElement('dashboard');
    if (dashboard) {
        dashboard.style.display = 'block';
    }
}

/**
 * Hide dashboard
 */
export function hideDashboard() {
    const dashboard = getElement('dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
}

/**
 * Show auth success container
 */
export function showAuthSuccess() {
    const authContainer = getElement('authContainer');
    const authSuccessContainer = getElement('authSuccessContainer');

    if (authContainer) {
        addClass(authContainer, 'hidden');
        removeClass(authContainer, 'active');
    }

    if (authSuccessContainer) {
        removeClass(authSuccessContainer, 'hidden');
        addClass(authSuccessContainer, 'active');
    }
}

/**
 * Hide auth success container
 */
export function hideAuthSuccess() {
    const authContainer = getElement('authContainer');
    const authSuccessContainer = getElement('authSuccessContainer');

    if (authContainer) {
        removeClass(authContainer, 'hidden');
        addClass(authContainer, 'active');
    }

    if (authSuccessContainer) {
        addClass(authSuccessContainer, 'hidden');
        removeClass(authSuccessContainer, 'active');
    }
}

/**
 * Update user info display
 * @param {Object} userInfo - User info object
 */
export function updateUserInfo(userInfo) {
    if (!userInfo) return;

    const avatar = getElement('userAvatar');
    const name = getElement('userName');
    const email = getElement('userEmail');

    if (avatar) {
        avatar.src = userInfo.picture || createDefaultAvatar();
        avatar.alt = userInfo.name;
    }

    if (name) {
        name.textContent = userInfo.name;
    }

    if (email) {
        email.textContent = userInfo.email;
    }
}

/**
 * Create default avatar SVG
 * @returns {string} Data URL for SVG avatar
 */
function createDefaultAvatar() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea">
            <circle cx="12" cy="8" r="4"/>
            <path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/>
        </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Populate select dropdown
 * @param {string} selectId - Select element ID
 * @param {Array} options - Array of option objects {value, text}
 * @param {string} defaultValue - Default option text
 */
export function populateSelect(selectId, options, defaultValue = '') {
    const select = getElement(selectId);
    if (!select) return;

    select.innerHTML = defaultValue ? `<option value="all">${defaultValue}</option>` : '';

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        select.appendChild(opt);
    });
}

/**
 * Update summary stats display
 * @param {Object} stats - Stats object {total, avg, bestDay, bestDayCount}
 */
export function updateSummaryStats(stats) {
    setText('totalCompleted', stats.total);
    setText('avgPerDay', stats.avg);
    setText('bestDay', stats.bestDay);
    setText('bestDayCount', stats.bestDayCount);
}

/**
 * Show task details panel
 * @param {string} date - Date string
 * @param {Array} tasks - Tasks to display
 * @param {string} listFilter - Current list filter
 * @param {string} taskFilter - Current task filter
 */
export function showTaskDetails(date, tasks, listFilter = 'all', taskFilter = 'all') {
    const container = getElement('taskDetailsContainer');
    const titleEl = getElement('taskDetailsTitle');
    const listEl = getElement('taskDetailsList');

    if (!container || !titleEl || !listEl) return;

    // Filter tasks
    let filteredTasks = tasks.filter(task => {
        if (task.completion_date !== date) return false;
        if (listFilter !== 'all' && task.list !== listFilter) return false;
        if (taskFilter !== 'all' && task.title !== taskFilter) return false;
        return true;
    });

    // Format date
    const dateObj = new Date(date);
    const formattedDate = formatFullDate(dateObj);
    titleEl.textContent = `📋 Completed Tasks - ${formattedDate}`;

    // Render tasks
    if (filteredTasks.length === 0) {
        listEl.innerHTML = '<li class="no-tasks-message">No tasks found for this date</li>';
    } else {
        listEl.innerHTML = filteredTasks.map(task => createTaskListItem(task)).join('');
    }

    // Show container
    addClass(container, 'active');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Create task list item HTML
 * @param {Object} task - Task object
 * @returns {string} HTML string
 */
function createTaskListItem(task) {
    const taskDateTime = formatDateTime(task.completed_date);

    // Build task link
    let taskLink = '#';
    if (task.source === 'calendar' && task.htmlLink) {
        taskLink = task.htmlLink;
    } else if (task.source === 'tasks' && task.selfLink) {
        taskLink = task.selfLink;
    } else if (task.eventId && task.calendarId) {
        taskLink = `https://calendar.google.com/calendar/u/0/r/eventedit/${task.eventId}`;
    }

    return `
        <li>
            <span class="task-checkmark">✓</span>
            <span class="task-list-item">${escapeHtml(task.title)}</span>
            <span class="task-list-meta">${escapeHtml(task.list)} • ${taskDateTime}</span>
            <a href="${taskLink}" target="_blank" class="task-link">
                🔗 Open
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </a>
        </li>
    `;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Hide task details panel
 */
export function hideTaskDetails() {
    const container = getElement('taskDetailsContainer');
    if (container) {
        removeClass(container, 'active');
    }
}

/**
 * Render calendar tasks list with checkboxes
 * @param {Array} completedTasks - Completed tasks
 * @param {Array} uncompletedTasks - Uncompleted tasks
 * @param {Function} onToggle - Toggle handler
 * @param {Object} pendingUpdates - Map of pending update task IDs
 */
export function renderCalendarTasks(completedTasks, uncompletedTasks, onToggle, pendingUpdates = new Map()) {
    const container = getElement('calendarTasksContainer');
    const listEl = getElement('calendarTaskList');
    const loadingEl = getElement('calendarTasksLoading');

    if (!container || !listEl) return;

    const allTasks = [
        ...completedTasks.map(t => ({ ...t, isCompleted: true })),
        ...uncompletedTasks.map(t => ({ ...t, isCompleted: false }))
    ];

    if (allTasks.length === 0) {
        listEl.innerHTML = '<li class="no-tasks-message">No calendar tasks found. Add events to your calendar to track them here.</li>';
        return;
    }

    listEl.innerHTML = allTasks.map(task => createCalendarTaskItem(task, onToggle, pendingUpdates)).join('');
}

/**
 * Create calendar task item HTML
 * @param {Object} task - Task object with isCompleted flag
 * @param {Function} onToggle - Toggle handler
 * @param {Object} pendingUpdates - Map of pending update task IDs
 * @returns {string} HTML string
 */
function createCalendarTaskItem(task, onToggle, pendingUpdates) {
    const taskId = task.eventId || task.id;
    const isPending = pendingUpdates.has(taskId);
    const completedClass = task.isCompleted ? 'completed' : '';
    const loadingClass = isPending ? 'loading' : '';

    const taskDate = task.completed_date || task.due;
    const formattedDate = taskDate ? formatDateTime(taskDate) : 'No date';

    let taskLink = '#';
    if (task.htmlLink) {
        taskLink = task.htmlLink;
    } else if (task.calendarId && task.eventId) {
        taskLink = `https://calendar.google.com/calendar/u/0/r/eventedit/${task.eventId}`;
    }

    return `
        <li class="calendar-task-item ${completedClass} ${loadingClass}" data-task-id="${taskId}">
            <input 
                type="checkbox" 
                class="calendar-task-checkbox" 
                ${task.isCompleted ? 'checked' : ''}
                ${isPending ? 'disabled' : ''}
                data-task-id="${taskId}"
                data-is-completed="${task.isCompleted}"
            >
            <div class="calendar-task-content">
                <div class="calendar-task-title">${escapeHtml(task.title)}</div>
                <div class="calendar-task-meta">
                    <span class="calendar-task-date">📅 ${formattedDate}</span>
                    <span class="calendar-task-list-name">📁 ${escapeHtml(task.list)}</span>
                    <span class="calendar-task-color-indicator" style="background-color: ${task.color || '#546e7a'}"></span>
                </div>
                ${isPending ? '<div class="calendar-task-error">Updating...</div>' : ''}
            </div>
            <div class="calendar-task-actions">
                <a href="${taskLink}" target="_blank" class="calendar-task-link" title="Open in Calendar">
                    🔗
                </a>
            </div>
        </li>
    `;
}

/**
 * Update task checkbox state
 * @param {string} taskId - Task ID
 * @param {boolean} isCompleted - New completion status
 */
export function updateTaskCheckbox(taskId, isCompleted) {
    const checkbox = document.querySelector(`.calendar-task-checkbox[data-task-id="${taskId}"]`);
    if (checkbox) {
        checkbox.checked = isCompleted;
        const taskItem = checkbox.closest('.calendar-task-item');
        if (taskItem) {
            toggleClass(taskItem, 'completed', isCompleted);
        }
    }
}

/**
 * Set task item loading state
 * @param {string} taskId - Task ID
 * @param {boolean} isLoading - Loading state
 */
export function setTaskLoading(taskId, isLoading) {
    const taskItem = document.querySelector(`.calendar-task-item[data-task-id="${taskId}"]`);
    if (taskItem) {
        toggleClass(taskItem, 'loading', isLoading);
    }
}

/**
 * Show task error message
 * @param {string} taskId - Task ID
 * @param {string} message - Error message
 */
export function showTaskError(taskId, message) {
    const taskItem = document.querySelector(`.calendar-task-item[data-task-id="${taskId}"]`);
    if (taskItem) {
        addClass(taskItem, 'error');
        const errorEl = taskItem.querySelector('.calendar-task-error');
        if (errorEl) {
            errorEl.textContent = message;
        }
    }
}

/**
 * Update active preset button
 * @param {string} activePreset - Active preset name
 */
export function updateActivePreset(activePreset) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        toggleClass(btn, 'active', btn.dataset.days === activePreset);
    });
}

/**
 * Add click event listener with delegation
 * @param {string} containerId - Container element ID
 * @param {string} selector - Event delegate selector
 * @param {Function} handler - Event handler
 */
export function addDelegatedListener(containerId, selector, handler) {
    const container = getElement(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
            handler(e, target);
        }
    });
}

/**
 * Set up element event listener
 * @param {string} id - Element ID
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export function addEventListener(id, event, handler, options = {}) {
    const element = getElement(id);
    if (element) {
        element.addEventListener(event, handler, options);
    }
}

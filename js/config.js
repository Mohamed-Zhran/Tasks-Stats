export const config = {
    googleClientId: '723524926112-4domph2bka6adne62hb1picahg3mgvnq.apps.googleusercontent.com',

    api: {
        tasksBase: 'https://www.googleapis.com/tasks/v1',
        calendarBase: 'https://www.googleapis.com/calendar/v3',
        oauth2Endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        userinfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo'
    },

    oauth: {
        scope: 'openid email profile https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar',
        state: 'tasks_app'
    },

    calendar: {
        colorIds: {
            completed: '2'
        },
        eventColors: {
            '1': '#a79b8e',
            '2': '#16a765',
            '3': '#8d6f65',
            '4': '#db4437',
            '5': '#fbd75b',
            '6': '#ff887c',
            '7': '#009688',
            '8': '#546e7a',
            '9': '#3f51b5',
            '10': '#0b8043',
            '11': '#d50000'
        }
    },

    taskStatus: {
        completed: 'completed',
        needsAction: 'needsAction'
    },

    storage: {
        accessToken: 'google_access_token',
        userInfo: 'google_user_info'
    },

    ui: {
        chart: {
            colors: {
                completed: 'rgba(46, 204, 113, 0.8)',
                completedBorder: 'rgba(46, 204, 113, 1)',
                uncompleted: 'rgba(231, 76, 60, 0.8)',
                uncompletedBorder: 'rgba(231, 76, 60, 1)',
                primary: 'rgba(102, 126, 234, 0.95)',
                primaryDark: 'rgba(102, 126, 234, 0.75)',
                primaryLight: 'rgba(102, 126, 234, 0.55)'
            },
            taskColors: {
                'مذاكرة انجليزى': { bg: 'rgba(231, 76, 60, 0.8)', border: 'rgba(231, 76, 60, 1)' },
                'مذاكرة كورس': { bg: 'rgba(52, 152, 219, 0.8)', border: 'rgba(52, 152, 219, 1)' },
                'مشروع جانبى': { bg: 'rgba(46, 204, 113, 0.8)', border: 'rgba(46, 204, 113, 1)' },
                'تمرين': { bg: 'rgba(155, 89, 182, 0.8)', border: 'rgba(155, 89, 182, 1)' },
                'حفظ قرأن': { bg: 'rgba(241, 196, 15, 0.8)', border: 'rgba(241, 196, 15, 1)' },
                'مذاكرة علم شرعي': { bg: 'rgba(230, 126, 34, 0.8)', border: 'rgba(230, 126, 34, 1)' }
            }
        },
        debounceDelay: 300,
        maxCalendarDays: 365,
        futureCalendarDays: 30
    }
};

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'google_access_token',
    USER_INFO: 'google_user_info'
};

export const TASK_STATUS = {
    COMPLETED: 'completed',
    NEEDS_ACTION: 'needsAction'
};

export const CALENDAR_COLORS = {
    SAGE: '2'
};

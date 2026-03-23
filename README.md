# Daily Task Completion App

A clean, modular web application for tracking daily task completion from Google Tasks and Google Calendar.

## Features

- 🔄 **Google OAuth2 Integration** - Secure authentication with Google
- 📋 **Google Tasks API** - Sync tasks from all your task lists
- 📅 **Google Calendar Integration** - Track tasks by event color: Sage = completed, all other colors = uncompleted
- 📊 **Interactive Charts** - Visualize completion trends with Chart.js
- 📁 **File Upload** - Import Tasks.json files manually
- 🎨 **Modern UI** - Dark theme with responsive design
- ⚡ **Performance Optimized** - Modular architecture with efficient rendering

## Project Structure

```
Tasks/
├── index.html              # Main HTML entry point
├── css/
│   ├── main.css           # Core styles, CSS variables, base styles
│   ├── components.css     # Component-specific styles
│   └── responsive.css     # Media queries for all screen sizes
├── js/
│   ├── app.js             # Main application entry point
│   ├── config.js          # Configuration and constants
│   ├── auth/
│   │   └── googleAuth.js  # Google OAuth2 authentication
│   ├── api/
│   │   ├── tasksApi.js    # Google Tasks API wrapper
│   │   └── calendarApi.js # Google Calendar API wrapper
│   ├── services/
│   │   ├── taskProcessor.js  # Task extraction and merging
│   │   └── filterService.js  # Filtering and data transformation
│   ├── ui/
│   │   ├── stateManager.js   # Centralized state management
│   │   ├── domUtils.js       # DOM manipulation utilities
│   │   └── chartManager.js   # Chart.js rendering
│   └── utils/
│       ├── dateUtils.js   # Date parsing and formatting
│       └── helpers.js     # Generic utility functions
└── README.md
```

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Google Tasks API**
   - **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Add scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/tasks`, `https://www.googleapis.com/auth/calendar.readonly`
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs: Add your app URL (e.g., `http://localhost:5500` or your production URL)
7. Copy the **Client ID**

### 2. Configure the Application

1. Open `js/config.js`
2. Replace the `googleClientId` value with your Client ID:

```javascript
export const config = {
    googleClientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    // ... rest of config
};
```

### 3. Run the Application

You need a local web server to run the application (required for ES6 modules):

**Option 1: Using Python**
```bash
# Python 3
python -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```

**Option 2: Using Node.js**
```bash
npx serve .
# or
npx http-server -p 5500
```

**Option 3: Using VS Code**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Option 4: Using PHP**
```bash
php -S localhost:5500
```

### 4. Open in Browser

Navigate to `http://localhost:5500` (or your configured port)

## Usage

### Authentication

1. **Sign in with Google** - Click the button to authenticate with your Google account
2. **Or upload Tasks.json** - Use the file input to manually load a Tasks.json file

### Calendar Integration

The app uses Google Calendar event colors to determine task status:
- **🟢 Sage (Green)** = Completed tasks
- **🎨 Any Other Color** = Uncompleted tasks (use different colors for task difficulty/priority)

To mark tasks in Calendar:
1. Create calendar events for your tasks
2. Set the event color to **Sage** when completed
3. Use different colors for uncompleted tasks to indicate difficulty or priority:
   - 🔴 Red = Hard/High priority
   - 🟡 Yellow = Medium priority
   - 🔵 Blue = Easy/Low priority
   - Or any color scheme you prefer

### Filters

- **List Filter** - Filter by specific task list or calendar
- **Task Filter** - Filter by specific task name
- **Date Range** - Select custom date range or use presets:
  - Today
  - Yesterday
  - Last 7 Days
  - Last 14 Days
  - Last 30 Days
  - All Time

### Charts

1. **Completed Tasks Per Day** - Bar chart showing daily completion counts
   - Click on any bar to see task details for that date
2. **Completed vs Uncompleted** - Doughnut chart showing overall completion ratio
3. **Completion Rate by Task** - Stacked bar chart showing completion rate per task

## Clean Code Standards Applied

### Architecture
- **Separation of Concerns** - UI, business logic, and API calls are separated
- **Single Responsibility** - Each module has one clear purpose
- **Modular Design** - ES6 modules with clear imports/exports

### Code Quality
- **Consistent Naming** - Descriptive camelCase for variables/functions
- **JSDoc Comments** - Documentation for all public APIs
- **Error Handling** - Try-catch blocks with meaningful messages
- **Pure Functions** - Where possible, functions have no side effects

### Performance
- **Debounced Updates** - Prevent rapid chart re-renders
- **Efficient Filtering** - Single-pass filtering algorithms
- **Chart Cleanup** - Proper destruction of Chart.js instances
- **Lazy Loading** - Modules loaded only when needed

### Maintainability
- **CSS Variables** - Centralized theming
- **Configuration Object** - All magic numbers/strings centralized
- **Utility Functions** - Reusable helper functions
- **State Management** - Centralized state with observer pattern

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- **Chart.js** (v4+) - Charting library (loaded via CDN)
- **Google APIs** - Tasks API, Calendar API, OAuth2

## Troubleshooting

### "Failed to fetch tasks"
- Check that you've enabled both Tasks API and Calendar API in Google Cloud Console
- Verify your Client ID is correct in `config.js`
- Ensure redirect URI matches exactly (including http/https and port)

### Charts not rendering
- Check browser console for errors
- Ensure Chart.js CDN is accessible
- Clear browser cache and reload

### Module loading errors
- Make sure you're running on a web server (not file:// protocol)
- Check that all file paths are correct
- Verify ES6 module support in your browser

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Follow existing code style
2. Add JSDoc comments for new functions
3. Test thoroughly before submitting
4. Keep commits focused and descriptive

/**
 * Google OAuth2 Authentication Module
 * Handles sign-in, sign-out, token management, and user info
 */

import { config, STORAGE_KEYS } from '../config.js';
import { safeJSONParse } from '../utils/helpers.js';

class GoogleAuth {
    constructor() {
        this.accessToken = null;
        this.userInfo = null;
        this.onSignInCallback = null;
        this.onSignOutCallback = null;
        this.onErrorCallback = null;
    }

    /**
     * Initialize authentication event listeners
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onSignIn - Called on successful sign-in
     * @param {Function} callbacks.onSignOut - Called on sign-out
     * @param {Function} callbacks.onError - Called on error
     */
    init({ onSignIn, onSignOut, onError }) {
        this.onSignInCallback = onSignIn;
        this.onSignOutCallback = onSignOut;
        this.onErrorCallback = onError;

        this._setupEventListeners();
        this._checkStoredAuth();
    }

    /**
     * Set up OAuth2 event listeners
     */
    _setupEventListeners() {
        // Handle OAuth2 callback from URL hash
        window.addEventListener('load', () => {
            if (window.location.hash) {
                this._handleOAuth2Callback();
            }
        });

        // Handle sign-in button
        const signinBtn = document.getElementById('googleSigninBtn');
        if (signinBtn) {
            signinBtn.addEventListener('click', () => this.signIn());
        }

        // Handle sign-out button
        const signoutBtn = document.getElementById('signoutBtn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', () => this.signOut());
        }

        // Handle refresh button
        const refreshBtn = document.getElementById('refreshTasksBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.accessToken && this.onSignInCallback) {
                    this.onSignInCallback(this.accessToken, this.userInfo);
                }
            });
        }
    }

    /**
     * Check for stored authentication on page load
     */
    _checkStoredAuth() {
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);

        if (storedToken && storedUser) {
            this.accessToken = storedToken;
            this.userInfo = safeJSONParse(storedUser, null);

            if (this.userInfo && this.onSignInCallback) {
                this.onSignInCallback(this.accessToken, this.userInfo);
            }
        }
    }

    /**
     * Handle OAuth2 callback from Google
     */
    _handleOAuth2Callback() {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('access_token');
        const state = hashParams.get('state');

        if (token && state === config.oauth.state) {
            // Clean URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
            this._fetchUserInfo(token);
        }
    }

    /**
     * Initiate Google OAuth2 sign-in flow
     */
    signIn() {
        if (!config.googleClientId || config.googleClientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            this._handleError('Please configure your Google Client ID in the code.');
            return;
        }

        const redirectUri = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            client_id: config.googleClientId,
            redirect_uri: redirectUri,
            response_type: 'token',
            scope: config.oauth.scope,
            include_granted_scopes: 'true',
            state: config.oauth.state
        });

        window.location.href = `${config.api.oauth2Endpoint}?${params.toString()}`;
    }

    /**
     * Sign out and clear stored credentials
     */
    signOut() {
        this.accessToken = null;
        this.userInfo = null;

        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);

        if (this.onSignOutCallback) {
            this.onSignOutCallback();
        }
    }

    /**
     * Fetch user info from Google API
     * @param {string} token - Access token
     */
    async _fetchUserInfo(token) {
        try {
            const response = await fetch(config.api.userinfoEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                this.signOut();
                this._handleError('Session expired. Please sign in again.');
                return;
            }

            if (response.ok) {
                const user = await response.json();
                this._handleSuccessfulAuth(token, user);
            } else {
                throw new Error('Failed to fetch user info');
            }
        } catch (error) {
            this._handleError('Failed to authenticate with Google');
        }
    }

    /**
     * Handle successful authentication
     * @param {string} token - Access token
     * @param {Object} user - User info object
     */
    _handleSuccessfulAuth(token, user) {
        this.accessToken = token;
        this.userInfo = user;

        // Store credentials
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));

        if (this.onSignInCallback) {
            this.onSignInCallback(token, user);
        }
    }

    /**
     * Handle authentication error
     * @param {string} message - Error message
     */
    _handleError(message) {
        if (this.onErrorCallback) {
            this.onErrorCallback(message);
        }
    }

    /**
     * Get current access token
     * @returns {string|null} Access token
     */
    getToken() {
        return this.accessToken;
    }

    /**
     * Get current user info
     * @returns {Object|null} User info
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.accessToken && !!this.userInfo;
    }
}

// Export singleton instance
export const googleAuth = new GoogleAuth();

/**
 * Authentication Service
 * 
 * This service centralizes all authentication-related functionality
 * including token management, user information, and role-based access control.
 * 
 * File path: frontend/src/utils/authService.js
 */

import { api } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user_data';

/**
 * Auth Service provides methods for handling authentication
 */
const authService = {
  /**
   * Get the authentication token from localStorage
   * @returns {string|null} The authentication token or null if not found
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Set the authentication token in localStorage and in API headers
   * @param {string} token - The authentication token
   */
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  /**
   * Remove the authentication token from localStorage and API headers
   */
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has a token, false otherwise
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Get the user information from localStorage
   * @returns {Object|null} The user object or null if not found
   */
  getUserInfo: () => {
    const userJSON = localStorage.getItem(USER_KEY);
    if (userJSON) {
      try {
        return JSON.parse(userJSON);
      } catch (e) {
        console.error('Error parsing user info from localStorage', e);
        return null;
      }
    }
    return null;
  },
  
  /**
   * Set user information in localStorage
   * @param {Object} user - The user object to store
   */
  setUserInfo: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  /**
   * Remove user information from localStorage
   */
  removeUserInfo: () => {
    localStorage.removeItem(USER_KEY);
  },
  
  /**
   * Check if user has a specific role
   * @param {string|string[]} requiredRoles - The role(s) to check
   * @returns {boolean} True if user has the required role, false otherwise
   */
  hasRole: (requiredRoles) => {
    const user = authService.getUserInfo();
    
    // If no user or no role, return false
    if (!user || !user.role) {
      return false;
    }
    
    // If requiredRoles is a string, convert to array
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user's role is in the required roles
    return roles.includes(user.role);
  },
  
  /**
   * Get the auth header for API requests
   * @returns {Object} The auth header object
   */
  getAuthHeader: () => {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
  
  /**
   * Login a user
   * @param {Object} credentials - The login credentials (email, password)
   * @returns {Promise} A promise that resolves to the user data
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      authService.setToken(token);
      authService.setUserInfo(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    authService.removeToken();
    authService.removeUserInfo();
  },
  
  /**
   * Register a new user
   * @param {Object} userData - The user data for registration
   * @returns {Promise} A promise that resolves to the registration response
   */
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  /**
   * Get the current user's profile
   * @returns {Promise} A promise that resolves to the user profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      
      // Update stored user info with latest data
      authService.setUserInfo(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      
      // If unauthorized, clear auth data
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        authService.removeToken();
        authService.removeUserInfo();
      }
      
      throw error;
    }
  },
  
  /**
   * Check if the current token is valid
   * @returns {Promise<boolean>} A promise that resolves to true if token is valid, false otherwise
   */
  validateToken: async () => {
    if (!authService.getToken()) {
      return false;
    }
    
    try {
      const response = await api.get('/api/auth/profile');
      authService.setUserInfo(response.data);
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      authService.removeToken();
      authService.removeUserInfo();
      return false;
    }
  }
};

export default authService;
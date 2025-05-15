import { api } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user_data';
const authService = {

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
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
  
  setUserInfo: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  removeUserInfo: () => {
    localStorage.removeItem(USER_KEY);
  },
  
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
  
  getAuthHeader: () => {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
  
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
  
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
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

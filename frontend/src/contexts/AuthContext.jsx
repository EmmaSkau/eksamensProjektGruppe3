import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import authService from '../utils/authService';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state when the component mounts
  useEffect(() => {
    const initAuth = async () => {
      if (authService.getToken()) {
        try {
          // Validate the token and get user profile
          const userData = await authService.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error initializing auth:', error);
          // Clear auth data on error
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      toast.success('Registrering gennemført! Log venligst ind.');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registrering fejlede');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login a user
  const login = async (credentials) => {
    try {
      setLoading(true);
      const userData = await authService.login(credentials);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login gennemført!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login fejlede');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout the user
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Du er nu logget ud');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await api.put('/api/auth/profile', userData);
      setUser(response.data);
      // Update stored user info
      authService.setUserInfo(response.data);
      toast.success('Profil opdateret');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fejl ved opdatering af profil');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
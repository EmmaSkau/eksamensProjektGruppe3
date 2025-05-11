import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401) by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods for various entities
const apiService = {
  // Auth endpoints
  auth: {
    register: (userData) => api.post('/api/auth/register', userData),
    login: (credentials) => api.post('/api/auth/login', credentials),
    getProfile: () => api.get('/api/auth/profile'),
    updateProfile: (userData) => api.put('/api/auth/profile', userData)
  },
  
  // Game endpoints
  games: {
    create: (gameData) => api.post('/api/games', gameData),
    getAll: () => api.get('/api/games'),
    getById: (id) => api.get(`/api/games/${id}`),
    update: (id, gameData) => api.put(`/api/games/${id}`, gameData),
    delete: (id) => api.delete(`/api/games/${id}`),
    join: (accessCode) => api.post('/api/games/join', { accessCode })
  },
  
  // Team endpoints
  teams: {
    create: (teamData) => api.post('/api/teams', teamData),
    getAll: () => api.get('/api/teams'),
    getById: (id) => api.get(`/api/teams/${id}`),
    update: (id, teamData) => api.put(`/api/teams/${id}`, teamData),
    delete: (id) => api.delete(`/api/teams/${id}`),
    join: (id) => api.post(`/api/teams/${id}/join`),
    getByGame: (gameId) => api.get(`/api/games/${gameId}/teams`)
  },
  
  // Task endpoints
  tasks: {
    create: (taskData) => api.post('/api/tasks', taskData),
    getAll: () => api.get('/api/tasks'),
    getById: (id) => api.get(`/api/tasks/${id}`),
    update: (id, taskData) => api.put(`/api/tasks/${id}`, taskData),
    delete: (id) => api.delete(`/api/tasks/${id}`),
    getByGame: (gameId) => api.get(`/api/games/${gameId}/tasks`)
  },
  
  // Submission endpoints
  submissions: {
    create: (submissionData) => api.post('/api/submissions', submissionData),
    getAll: () => api.get('/api/submissions'),
    getById: (id) => api.get(`/api/submissions/${id}`),
    update: (id, submissionData) => api.put(`/api/submissions/${id}`, submissionData),
    getByTeam: (teamId) => api.get(`/api/teams/${teamId}/submissions`),
    createWithFile: (submissionData, file) => {
      const formData = new FormData();
      
      // Append file if provided
      if (file) {
        formData.append('file', file);
      }
      
      // Append other submission data
      Object.keys(submissionData).forEach(key => {
        formData.append(key, submissionData[key]);
      });
      
      return api.post('/api/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
  },
  
  // Reflection endpoints
  reflections: {
    create: (reflectionData) => api.post('/api/reflections', reflectionData),
    getAll: () => api.get('/api/reflections'),
    getById: (id) => api.get(`/api/reflections/${id}`),
    getByGame: (gameId) => api.get(`/api/games/${gameId}/reflections`)
  },
  
  // Admin endpoints
  admin: {
    getUsers: () => api.get('/api/admin/users'),
    updateUser: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
    getStats: () => api.get('/api/admin/stats'),
    exportGame: (gameId) => api.get(`/api/admin/export/games/${gameId}`, {
      responseType: 'blob'
    })
  }
};

// Only have one default export
export default apiService;
export { api };
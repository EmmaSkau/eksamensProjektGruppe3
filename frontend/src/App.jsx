import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

// Participant pages
import GameJoin from './pages/participant/GameJoin';
import TaskList from './pages/participant/TaskList';
import TaskSolve from './pages/participant/TaskSolve';
import TeamDashboard from './pages/participant/TeamDashboard';
import Reflection from './pages/participant/Reflection';
import TeamJoin from './pages/participant/TeamJoin';

// Instructor pages
import GameCreate from './pages/instructor/GameCreate';
import GameManage from './pages/instructor/GameManage';
import TaskCreate from './pages/instructor/TaskCreate';
import SubmissionEvaluate from './pages/instructor/SubmissionEvaluate';
import InstructorDashboard from './pages/instructor/InstructorDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllGames from './pages/admin/AllGames';
import UserManagement from './pages/admin/UserManagement';
import GameStatistics from './pages/admin/GameStatistics';
import UserCreate from './pages/admin/UserCreate'; // Add this import for UserCreate component

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const PageContainer = ({ children }) => (
  <div className="container mx-auto px-4 py-8">
    {children}
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PageContainer><Home /></PageContainer>} />
              <Route path="/login" element={<PageContainer><Login /></PageContainer>} />
              <Route path="/register" element={<PageContainer><Register /></PageContainer>} />
              
              {/* Participant routes */}
              <Route 
                path="/join-game" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><GameJoin /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/game/:gameId/join-team" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><TeamJoin /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/team-dashboard/:teamId" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><TeamDashboard /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks/:gameId" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><TaskList /></PageContainer>
                  </ProtectedRoute>
                } 
                
              />
              <Route 
                path="/solve-task/:taskId" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><TaskSolve /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reflection/:gameId" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'instructor', 'admin']}>
                    <PageContainer><Reflection /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              
              {/* Instructor routes */}
              <Route 
                path="/instructor/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PageContainer><InstructorDashboard /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-game" 
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PageContainer><GameCreate /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-game/:gameId" 
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PageContainer><GameManage /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-task/:gameId" 
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PageContainer><TaskCreate /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/evaluate-submission/:submissionId" 
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <PageContainer><SubmissionEvaluate /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageContainer><AdminDashboard /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              {/* New route for All Games */}
              <Route 
                path="/admin/all-games" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageContainer><AllGames /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageContainer><UserManagement /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              {/* Add new route for creating users */}
              <Route 
                path="/admin/users/new" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageContainer><UserCreate /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/statistics/:gameId" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageContainer><GameStatistics /></PageContainer>
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ToastContainer 
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

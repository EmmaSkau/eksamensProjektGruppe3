import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };
  
  // Get appropriate dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'instructor':
        return '/instructor/dashboard';
      case 'participant':
      default:
        return '/join-game';
    }
  };

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo and brand */}
          <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <span className="font-bold text-xl">HJV</span>
            <span className="ml-2 text-sm font-medium hidden md:inline">Ledelsestræner</span>
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-blue-200">Hjem</Link>
            
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="hover:text-blue-200">
                  {user.role === 'participant' ? 'Find spil' : 'Dashboard'}
                </Link>
                
                {(user.role === 'instructor' || user.role === 'admin') && (
                  <Link to="/create-game" className="hover:text-blue-200">Opret spil</Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center hover:text-blue-200">
                    <span>{user.username}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      Logget ind som <span className="font-medium">{user.role}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Log ud
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Log ind</Link>
                <Link to="/register" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md">Opret konto</Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-blue-800">
            <Link 
              to="/" 
              className="block py-2 hover:bg-blue-800 px-2 rounded"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hjem
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="block py-2 hover:bg-blue-800 px-2 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.role === 'participant' ? 'Find spil' : 'Dashboard'}
                </Link>
                
                {(user.role === 'instructor' || user.role === 'admin') && (
                  <Link 
                    to="/create-game" 
                    className="block py-2 hover:bg-blue-800 px-2 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Opret spil
                  </Link>
                )}
                
                <div className="border-t border-blue-800 pt-2 mt-2">
                  <div className="px-2 py-1 text-sm text-blue-300">
                    Logget ind som <span className="font-medium">{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 hover:bg-blue-800 px-2 rounded"
                  >
                    Log ud
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 hover:bg-blue-800 px-2 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log ind
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 hover:bg-blue-800 px-2 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Opret konto
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  // Function to determine the dashboard link based on user role
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
    <div className="flex flex-col items-center">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-6">Hjemmeværnsskolens Ledelsestræner</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Velkommen til den digitale ledelsestræner</h2>
          
          <p className="text-gray-700 mb-6">
            Dette spilbaserede træningsværktøj giver deltagere mulighed for at øve ledelseskompetencer
            gennem praktiske opgaver, refleksion og samarbejde i teams.
          </p>
          
          {isAuthenticated ? (
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-800">
                Velkommen tilbage, {user.username}!
              </h3>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to={getDashboardLink()}
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-md"
                >
                  {user.role === 'participant' ? 'Find spil' : 'Gå til dashboard'}
                </Link>
                
                {/* Conditionally show Create Game button for instructors and admins */}
                {(user.role === 'instructor' || user.role === 'admin') && (
                  <Link
                    to="/create-game"
                    className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-6 rounded-md"
                  >
                    Opret nyt spil
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/login"
                className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-md"
              >
                Log ind
              </Link>
              <Link
                to="/register"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md"
              >
                Opret konto
              </Link>
            </div>
          )}
        </div>
        
        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Opgaver og point</h3>
            <p className="text-gray-700">
              Vælg og løs forskellige typer af opgaver, optjen point og træn dine ledelsesevner.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Teamarbejde</h3>
            <p className="text-gray-700">
              Samarbejd i teams, konkurrer mod andre hold og lær af hinanden.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Refleksion</h3>
            <p className="text-gray-700">
              Reflekter over jeres beslutninger og lær gennem feedback og evaluering.
            </p>
          </div>
        </div>
        
        {/* About section */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Om træningsværktøjet</h2>
          
          <p className="text-gray-700 mb-4">
            Dette værktøj er udviklet som en del af Hjemmeværnsskolens digitale lederuddannelse.
            Målet er at give deltagere praktisk erfaring med ledelsessituationer i en sikker og
            struktureret læringsmiljø.
          </p>
          
          <p className="text-gray-700">
            Instruktører kan oprette spil, definere opgaver og evaluere deltagernes besvarelser,
            mens deltagere kan joinfae spil, løse opgaver i teams og reflektere over deres læring.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api'; // Import only the api object, not apiService
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [games, setGames] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Fetch instructor's games and pending submissions
  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        setIsLoading(true);
        
        // Get games created by this instructor - using direct API call instead of service
        const gamesResponse = await api.get('/api/games/instructor');
        setGames(gamesResponse.data);
        
        // Get pending submissions (not evaluated yet)
        const submissionsResponse = await api.get('/api/submissions/pending');
        setPendingSubmissions(submissionsResponse.data);
      } catch (error) {
        console.error('Error fetching instructor data:', error);
        toast.error('Der opstod en fejl ved hentning af data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInstructorData();
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Du er nu logget ud');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Der opstod en fejl ved forsøg på at logge ud');
    }
  };
  
  // Filter submissions by selected game
  const filteredSubmissions = selectedGame === 'all' 
    ? pendingSubmissions 
    : pendingSubmissions.filter(submission => submission.task.game._id === selectedGame);
  
  // Group games by active status
  const activeGames = games.filter(game => game.isActive);
  const inactiveGames = games.filter(game => !game.isActive);
  
  // Calculate stats
  const totalTeams = games.reduce((acc, game) => acc + game.teamCount, 0);
  const totalParticipants = games.reduce((acc, game) => acc + game.participantCount, 0);
  const totalTasks = games.reduce((acc, game) => acc + game.taskCount, 0);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instruktør Dashboard</h1>
              <p className="text-gray-600 mt-1">Velkommen, {user?.username}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Log ud
              </button>
              
              <Link
                to="/create-game"
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Opret nyt spil
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase">Spil</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{games.length}</p>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aktive spil</span>
                <span className="font-medium text-blue-600">{activeGames.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${games.length > 0 ? (activeGames.length / games.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all duration-200">
                <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase">Hold</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalTeams}</p>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deltagere</span>
                <span className="font-medium text-green-600">{totalParticipants}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-green-600 h-1.5 rounded-full" 
                  style={{ width: `${totalTeams > 0 ? Math.min((totalParticipants / (totalTeams * 4)) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                <svg className="w-6 h-6 text-amber-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase">Bedømmelser</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingSubmissions.length}</p>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <Link 
                to={pendingSubmissions.length > 0 ? `/evaluate-submission/${pendingSubmissions[0]._id}` : '#'}
                className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pendingSubmissions.length > 0
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Bedøm næste
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active games */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Aktive spil</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {activeGames.length} spil
          </span>
        </div>
        
        {activeGames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spiltitel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adgangskode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opgaver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startdato
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handling
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeGames.map((game) => (
                  <tr key={game._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{game.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block">{game.accessCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{game.teamCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{game.taskCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(game.startTime).toLocaleDateString('da-DK')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/manage-game/${game._id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        Administrer
                      </Link>
                      <Link to={`/create-task/${game._id}`} className="text-green-600 hover:text-green-900">
                        Tilføj opgave
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 px-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <p className="mt-4 text-gray-500 mb-4">Du har ingen aktive spil i øjeblikket.</p>
            <Link to="/create-game" className="text-blue-600 hover:text-blue-800 font-medium">
              Opret dit første spil →
            </Link>
          </div>
        )}
      </div>
      
      {/* Pending submissions */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Opgaver der venter på bedømmelse</h2>
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingSubmissions.length} opgaver
          </span>
        </div>
        
        {pendingSubmissions.length > 0 ? (
          <>
            <div className="p-4 border-b bg-gray-50">
              <label htmlFor="gameFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrer efter spil
              </label>
              <select
                id="gameFilter"
                className="px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="all">Alle spil</option>
                {games.map(game => (
                  <option key={game._id} value={game._id}>{game.title}</option>
                ))}
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opgave
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hold
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indsendt
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Handling
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.task.title}</div>
                        <div className="text-xs text-gray-500">{submission.task.game.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full 
                          ${submission.task.type === 'multiple_choice' ? 'bg-green-100 text-green-800' : ''}
                          ${submission.task.type === 'text' ? 'bg-blue-100 text-blue-800' : ''}
                          ${submission.task.type === 'video' ? 'bg-purple-100 text-purple-800' : ''}
                        `}>
                          {submission.task.type === 'multiple_choice' ? 'Multiple choice' : ''}
                          {submission.task.type === 'text' ? 'Tekst' : ''}
                          {submission.task.type === 'video' ? 'Video' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString('da-DK', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/evaluate-submission/${submission._id}`} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Bedøm
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-10 px-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <p className="mt-4 text-gray-500">
              Der er ingen opgaver, der venter på bedømmelse i øjeblikket.
            </p>
          </div>
        )}
      </div>
      
      {/* Inactive games */}
      {inactiveGames.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Inaktive spil</h2>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {inactiveGames.length} spil
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spiltitel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opgaver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slut dato
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handling
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inactiveGames.map((game) => (
                  <tr key={game._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{game.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{game.teamCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{game.taskCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {game.endTime ? new Date(game.endTime).toLocaleDateString('da-DK') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/manage-game/${game._id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        Vis detaljer
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            // Using the direct api call instead of apiService
                            await api.put(`/api/games/instructor/${game._id}`, { isActive: true });
                            setGames(games.map(g => 
                              g._id === game._id ? { ...g, isActive: true } : g
                            ));
                            toast.success('Spil aktiveret!');
                          } catch (error) {
                            console.error('Error activating game:', error);
                            toast.error('Der opstod en fejl ved aktivering af spillet');
                          }
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Aktiver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center text-red-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Log ud</h3>
            <p className="text-center text-gray-600 mb-6">
              Er du sikker på, at du vil logge ud? Din session vil blive afsluttet.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Log ud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
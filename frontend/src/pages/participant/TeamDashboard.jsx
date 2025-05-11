import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const TeamDashboard = () => {
  const { teamId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [game, setGame] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [scoreboard, setScoreboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching team data for teamId:', teamId);
        
        // Get team details
        const teamResponse = await api.get(`/api/teams/${teamId}`);
        console.log('Team data:', teamResponse.data);
        setTeam(teamResponse.data);
        
        // Get game details
        const gameResponse = await api.get(`/api/games/${teamResponse.data.game._id}`);
        console.log('Game data:', gameResponse.data);
        setGame(gameResponse.data);
        
        // Get team submissions
        const submissionsResponse = await api.get(`/api/teams/${teamId}/submissions`);
        console.log('Submissions data:', submissionsResponse.data);
        setSubmissions(submissionsResponse.data);
        
        // Get scoreboard for the game
        const scoreboardResponse = await api.get(`/api/games/${teamResponse.data.game._id}/scoreboard`);
        console.log('Scoreboard data:', scoreboardResponse.data);
        setScoreboard(scoreboardResponse.data);
      } catch (error) {
        console.error('Error fetching team data:', error);
        toast.error('Der opstod en fejl ved hentning af holddata');
        // Navigate back to join game on error
        navigate('/join-game');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamData();
  }, [teamId, navigate]);
  
  // Navigation functions
  const goToTasks = (gameId) => {
    navigate(`/tasks/${gameId}`);
  };
  
  const goToReflection = (gameId) => {
    navigate(`/reflection/${gameId}`);
  };
  
  const goToJoinGame = () => {
    navigate('/join-game');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Du er nu logget ud');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!team || !game) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Hold ikke fundet</h2>
        <p className="text-gray-600 mb-6">Det valgte hold findes ikke eller du har ikke adgang til det.</p>
        <button 
          onClick={goToJoinGame}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          Tilbage til Find spil
        </button>
      </div>
    );
  }
  
  // Find team position in scoreboard
  const teamPosition = scoreboard.findIndex(item => item._id === teamId) + 1;
  
  // Calculate task completion stats
  const completedTasks = submissions.filter(s => s.isEvaluated).length;
  const pendingTasks = submissions.filter(s => !s.isEvaluated).length;
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Team header with logout button */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="flex justify-end p-2">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log ud
          </button>
        </div>
        <div className="md:flex">
          <div className="p-6 md:p-8 md:flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{team.name}</h1>
            <p className="text-gray-600">Spil: {game.title}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 md:p-8 flex flex-col items-center justify-center md:w-56">
            <span className="text-sm uppercase tracking-wide opacity-80">Holdets point</span>
            <span className="text-4xl font-bold mt-1">{team.points}</span>
            <span className="text-sm mt-2">Placering: {teamPosition} af {scoreboard.length}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Team members card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Holdmedlemmer
            </h2>
            
            <ul className="space-y-3">
              {team.members.map(member => (
                <li key={member._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full h-10 w-10 flex items-center justify-center font-medium mr-3">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-800">{member.username}</span>
                  {member._id === user._id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Dig
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Tasks progress card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              Opgavefremdrift
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Afsluttede opgaver</span>
                  <span className="text-sm font-medium text-blue-800">{completedTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-800 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${completedTasks > 0 ? (completedTasks / (completedTasks + pendingTasks)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Ventende bedømmelse</span>
                  <span className="text-sm font-medium text-amber-600">{pendingTasks}</span>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t">
                <button 
                  onClick={() => goToTasks(game._id)}
                  className="inline-block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2.5 px-4 rounded-lg w-full text-center font-medium transition-all duration-200"
                >
                  Find nye opgaver
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game info card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Spiloplysninger
            </h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500">Spiltitel</span>
                <p className="text-gray-800 font-medium">{game.title}</p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500">Beskrivelse</span>
                <p className="text-gray-800">{game.description}</p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500">Adgangskode</span>
                <p className="text-gray-800 font-mono bg-gray-100 rounded px-2 py-1 inline-block">{game.accessCode}</p>
              </div>
              
              {game.endTime && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500">Slutter</span>
                  <p className="text-gray-800">
                    {new Date(game.endTime).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t">
                <button 
                  onClick={() => goToReflection(game._id)}
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-lg w-full text-center font-medium transition-all duration-200"
                >
                  Refleksion & evaluering
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scoreboard section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            Rangliste
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placering
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opgaver løst
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scoreboard.map((scoreTeam, index) => (
                  <tr 
                    key={scoreTeam._id} 
                    className={`${scoreTeam._id === teamId ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : ''}
                          ${index === 1 ? 'bg-gray-100 text-gray-800 border border-gray-300' : ''}
                          ${index === 2 ? 'bg-amber-100 text-amber-800 border border-amber-300' : ''}
                          ${index > 2 ? 'bg-gray-100 text-gray-800' : ''}
                          h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {scoreTeam.name}
                      {scoreTeam._id === teamId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Dit hold
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-gray-900">{scoreTeam.points}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scoreTeam.completedTasks || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Recent submissions */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Seneste besvarelser
          </h2>
          
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.slice(0, 5).map(submission => (
                <div key={submission._id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900">{submission.task.title}</h3>
                    <div>
                      {submission.isEvaluated ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                          {submission.pointsEarned >= 0 ? `+${submission.pointsEarned}` : submission.pointsEarned} point
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200">
                          Afventer bedømmelse
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {submission.task.type === 'multiple_choice' ? 'Multiple choice' : ''}
                    {submission.task.type === 'text' ? 'Tekstbesvarelse' : ''}
                    {submission.task.type === 'video' ? 'Videobesvarelse' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Indsendt {new Date(submission.submittedAt).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <p className="mt-4 text-gray-500">Ingen besvarelser endnu.</p>
              <button 
                onClick={() => goToTasks(game._id)}
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Find og løs opgaver →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const GameJoin = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [lastJoinResponse, setLastJoinResponse] = useState(null);
  const [debugVisible, setDebugVisible] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user's active games/teams on component mount
  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        console.log('Fetching user teams...');
        const response = await api.get('/api/teams/user');
        console.log('User teams:', response.data);
        setUserTeams(response.data);
      } catch (error) {
        console.error('Error fetching user teams:', error);
        toast.error('Der opstod en fejl ved hentning af dine hold');
      }
    };
    
    fetchUserTeams();
  }, []);
  
  // Handle access code input change
  const handleAccessCodeChange = (e) => {
    setAccessCode(e.target.value.toUpperCase());
  };
  
  // Handle join game form submission
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!accessCode) {
      toast.error('Indtast venligst en adgangskode');
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('Joining game with access code:', accessCode);
      
      // Join game API call
      const response = await api.post('/api/games/join', { accessCode });
      console.log('Join game response:', response.data);
      
      // Save response for debugging
      setLastJoinResponse(response.data);
      
      const game = response.data.game;
      const team = response.data.team;
      
      toast.success(`Tilsluttet spillet: ${game.title}`);
      
      // Simplified navigation logic
      if (team) {
        console.log('User already has a team. Navigating to team dashboard:', team._id);
        navigate(`/team-dashboard/${team._id}`);
      } else {
        console.log('User needs to join a team. Navigating to:', `/game/${game._id}/join-team`);
        navigate(`/game/${game._id}/join-team`);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      
      if (error.response) {
        console.error('Response error data:', error.response.data);
        if (error.response.status === 404) {
          toast.error('Spillet blev ikke fundet eller er inaktivt');
        } else {
          toast.error(error.response.data?.message || 'Der opstod en fejl ved tilslutning til spillet');
        }
      } else if (error.request) {
        toast.error('Kunne ikke forbinde til serveren');
      } else {
        toast.error('Der opstod en fejl ved tilslutning til spillet');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to team dashboard when a team is selected - simplified navigation
  const handleTeamSelect = (teamId) => {
    console.log('Team selected, navigating to:', teamId);
    navigate(`/team-dashboard/${teamId}`);
  };

  // Toggle debug information
  const toggleDebug = () => {
    setDebugVisible(!debugVisible);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Find spil</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Join game with access code */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tilslut med adgangskode</h2>
          
          <form onSubmit={handleJoinGame}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accessCode">
                Spil-kode
              </label>
              <input
                className="appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center text-xl uppercase tracking-widest"
                id="accessCode"
                type="text"
                placeholder="XXXXXX"
                maxLength="6"
                value={accessCode}
                onChange={handleAccessCodeChange}
              />
            </div>
            
            <button
              type="submit"
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Tilslutter...' : 'Tilslut spil'}
            </button>
          </form>
          
          {/* Last join response - debugging */}
          {lastJoinResponse && (
            <div className="mt-4">
              <button 
                onClick={toggleDebug}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {debugVisible ? 'Skjul debug info' : 'Vis debug info'}
              </button>
              
              {debugVisible && (
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <pre>{JSON.stringify(lastJoinResponse, null, 2)}</pre>
                  
                  {lastJoinResponse.game && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="font-bold">Game Found:</p>
                      <p>ID: {lastJoinResponse.game._id}</p>
                      <p>Title: {lastJoinResponse.game.title}</p>
                      
                      {lastJoinResponse.team ? (
                        <div className="mt-1">
                          <p className="font-bold">Team Found:</p>
                          <p>ID: {lastJoinResponse.team._id}</p>
                          <p>Name: {lastJoinResponse.team.name}</p>
                          <div className="mt-2">
                            <Link 
                              to={`/team-dashboard/${lastJoinResponse.team._id}`} 
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Go to Team Dashboard
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="font-bold">No Team Found - Need to Join/Create</p>
                          <div className="mt-2">
                            <Link 
                              to={`/game/${lastJoinResponse.game._id}/join-team`} 
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Go to Join Team
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* User's active teams */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dine aktive hold</h2>
          
          {userTeams.length > 0 ? (
            <div className="space-y-4">
              {userTeams.map(team => (
                <div 
                  key={team._id} 
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <h3 className="font-medium text-blue-800">{team.name}</h3>
                  <p className="text-sm text-gray-600">Spil: {team.game?.title || 'Unknown Game'}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {team.members?.length || 0} medlemmer
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {team.points || 0} point
                    </span>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => handleTeamSelect(team._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium"
                    >
                      Gå til holdet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Du er ikke medlem af nogen hold endnu.</p>
              <p className="text-sm text-gray-600">
                Tilslut et spil med adgangskoden for at komme i gang.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameJoin;
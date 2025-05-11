import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const TeamJoin = () => {
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch game details and existing teams on component mount
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch game details
        const gameResponse = await api.get(`/api/games/${gameId}`);
        console.log('Game details:', gameResponse.data);
        setGame(gameResponse.data);
        
        // Fetch teams for this game
        const teamsResponse = await api.get(`/api/games/${gameId}/teams`);
        console.log('Game teams:', teamsResponse.data);
        setTeams(teamsResponse.data);
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Der opstod en fejl ved hentning af spildata');
        
        // Navigate back to join game page if there's an error
        navigate('/join-game');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId, navigate]);
  
  // Handle joining an existing team
  const handleJoinTeam = async (teamId) => {
    try {
      setIsLoading(true);
      
      // Join team API call
      const response = await api.post(`/api/teams/${teamId}/join`, {});
      
      toast.success(`Tilsluttet hold: ${response.data.name}`);
      
      // Navigate to team dashboard
      navigate(`/team-dashboard/${teamId}`);
    } catch (error) {
      console.error('Error joining team:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Der opstod en fejl ved tilslutning til holdet');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle creating a new team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!newTeamName.trim()) {
      toast.error('Indtast venligst et holdnavn');
      return;
    }
    
    try {
      setIsCreatingTeam(true);
      
      // Create team API call
      const response = await api.post('/api/teams', {
        name: newTeamName,
        game: gameId
      });
      
      toast.success(`Hold oprettet: ${response.data.name}`);
      
      // Navigate to team dashboard
      navigate(`/team-dashboard/${response.data._id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Der opstod en fejl ved oprettelse af holdet');
      }
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-medium">Spillet blev ikke fundet.</p>
        <div className="mt-4">
          <Link 
            to="/join-game"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium"
          >
            Tilbage til Find spil
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">{game.title}</h1>
      <p className="text-gray-600 mb-8">{game.description}</p>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Join existing team */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tilslut eksisterende hold</h2>
          
          {teams.length > 0 ? (
            <div className="space-y-4">
              {teams.map(team => (
                <div 
                  key={team._id} 
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <h3 className="font-medium text-blue-800">{team.name}</h3>
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
                      onClick={() => handleJoinTeam(team._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Tilslutter...' : 'Tilslut dette hold'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Der er ingen hold i dette spil endnu.</p>
              <p className="text-sm text-gray-600 mt-2">
                Opret dit eget hold for at komme i gang.
              </p>
            </div>
          )}
        </div>
        
        {/* Create new team */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Opret nyt hold</h2>
          
          <form onSubmit={handleCreateTeam}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teamName">
                Holdnavn
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="teamName"
                type="text"
                placeholder="Indtast holdnavn"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isCreatingTeam}
            >
              {isCreatingTeam ? 'Opretter...' : 'Opret hold'}
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/join-game"
              className="block text-center text-blue-600 hover:text-blue-800"
            >
              Tilbage til Find spil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamJoin;
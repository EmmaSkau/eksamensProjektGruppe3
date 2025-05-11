import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const JoinTeam = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  // Fetch game details and existing teams
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching game data for gameId:', gameId);
        
        // Fetch game details using direct API call
        const gameResponse = await api.get(`/api/games/${gameId}`);
        console.log('Game data:', gameResponse.data);
        setGame(gameResponse.data);
        
        // Fetch existing teams for this game using direct API call
        const teamsResponse = await api.get(`/api/games/${gameId}/teams`);
        console.log('Teams data:', teamsResponse.data);
        setTeams(teamsResponse.data);
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Der opstod en fejl ved hentning af spildata');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);
  
  // Create a new team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!newTeamName.trim()) {
      toast.error('Indtast venligst et holdnavn');
      return;
    }
    
    try {
      setIsCreatingTeam(true);
      
      console.log('Creating team:', { name: newTeamName, game: gameId });
      
      // Create team API call
      const response = await api.post('/api/teams', {
        name: newTeamName,
        game: gameId
      });
      
      console.log('Team created:', response.data);
      toast.success('Hold oprettet!');
      
      // Use direct navigation
      setTimeout(() => {
        window.location.href = `/team-dashboard/${response.data._id}`;
      }, 500);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved oprettelse af hold');
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  // Join existing team
  const handleJoinTeam = async (teamId) => {
    try {
      console.log('Joining team:', teamId);
      
      // Join team API call
      await api.post(`/api/teams/${teamId}/join`);
      
      toast.success('Du har tilsluttet dig holdet!');
      
      // Use direct navigation
      setTimeout(() => {
        window.location.href = `/team-dashboard/${teamId}`;
      }, 500);
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved tilslutning til holdet');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">Spil ikke fundet</h2>
        <p className="mt-4 text-gray-600">Spillet du leder efter findes ikke eller er ikke længere aktivt.</p>
        <button
          onClick={() => window.location.href = '/join-game'}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tilbage til spilsøgning
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">{game.title}</h1>
        {game.description && (
          <p className="mt-2 text-gray-600">{game.description}</p>
        )}
      </div>
      
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
                    <button
                      onClick={() => handleJoinTeam(team._id)}
                      className="px-4 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                    >
                      Tilslut
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Der er ingen hold i dette spil endnu.</p>
              <p className="text-sm text-gray-600 mt-2">
                Opret det første hold ved at udfylde formularen til højre.
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
                required
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
        </div>
      </div>
      
      {/* Back button */}
      <div className="mt-8">
        <button
          onClick={() => window.location.href = '/join-game'}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Tilbage til spilsøgning
        </button>
      </div>
    </div>
  );
};

export default JoinTeam;
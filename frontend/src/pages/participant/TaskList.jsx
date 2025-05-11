import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const TaskList = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [game, setGame] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch game data, tasks, and user's team
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching game with ID:', gameId);
        
        // Get game details
        const gameResponse = await api.get(`/api/games/${gameId}`);
        console.log('Game data:', gameResponse.data);
        setGame(gameResponse.data);
        
        // Get tasks for this game
        const tasksResponse = await api.get(`/api/games/${gameId}/tasks`);
        console.log('Tasks data:', tasksResponse.data);
        setTasks(tasksResponse.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(tasksResponse.data.map(task => task.category))];
        setCategories(uniqueCategories);
        
        // Find user's team for this game
        const teamsResponse = await api.get('/api/teams/user');
        console.log('User teams:', teamsResponse.data);
        
        const userTeamForGame = teamsResponse.data.find(team => 
          team.game && team.game._id === gameId
        );
        
        if (userTeamForGame) {
          console.log('User team for this game:', userTeamForGame);
          setTeam(userTeamForGame);
          
          // Get team submissions
          const submissionsResponse = await api.get(`/api/teams/${userTeamForGame._id}/submissions`);
          console.log('Team submissions:', submissionsResponse.data);
          setSubmissions(submissionsResponse.data);
        } else {
          console.log('User does not have a team for this game');
          // Redirect to team join page if no team found for this game
          toast.info('Du skal først være medlem af et hold i dette spil');
          navigate(`/game/${gameId}/join-team`);
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Der opstod en fejl ved hentning af spildata');
        navigate('/join-game');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Spil ikke fundet</h2>
        <p className="text-gray-600 mb-6">Det valgte spil findes ikke eller er ikke længere aktivt.</p>
        <Link to="/join-game" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
          Tilbage til Find spil
        </Link>
      </div>
    );
  }
  
  // Filter tasks by category if selected
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);
  
  // Check if task is completed
  const isTaskCompleted = (taskId) => {
    return submissions.some(submission => 
      submission.task._id === taskId || submission.task === taskId
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-1">{game.title}</h1>
          <p className="text-gray-600">
            {team ? (
              <>Hold: <span className="font-medium">{team.name}</span></>
            ) : (
              'Intet hold valgt'
            )}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link 
            to={team ? `/team-dashboard/${team._id}` : `/game/${game._id}/join-team`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition"
          >
            {team ? 'Tilbage til holdet' : 'Vælg hold'}
          </Link>
          
          <Link 
            to={`/reflection/${game._id}`}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded text-sm font-medium transition"
          >
            Refleksion & evaluering
          </Link>
        </div>
      </div>
      
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Alle kategorier
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Tasks grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => {
            const isCompleted = isTaskCompleted(task._id);
            
            return (
              <div key={task._id} className="bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{task.title}</h2>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {isCompleted ? 'Afsluttet' : 'Åben'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {task.timeLimit} min
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                      <span className="bg-gray-100 rounded px-2">{task.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-red-500">
                      Risiko: {task.riskPoints} point
                    </div>
                    <div className="text-green-600">
                      Belønning: {task.rewardPoints} point
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Link 
                      to={`/solve-task/${task._id}`}
                      className={`block text-center py-2 px-4 rounded-lg font-medium transition ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                      }`}
                      onClick={e => isCompleted && e.preventDefault()}
                    >
                      {isCompleted ? 'Allerede løst' : 'Løs opgave'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ingen opgaver fundet</h2>
          <p className="text-gray-600">
            {selectedCategory !== 'all' 
              ? `Der er ingen opgaver i kategorien "${selectedCategory}".` 
              : 'Der er ingen opgaver tilgængelige i dette spil endnu.'}
          </p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Vis alle kategorier
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
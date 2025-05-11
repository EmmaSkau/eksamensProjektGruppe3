import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService, { api } from '../../utils/api';
import { toast } from 'react-toastify';

const GameManage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for delete/update operations
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit game form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    accessCode: '',
    isActive: true,
    endTime: ''
  });
  
  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        // Get game details
        const gameResponse = await api.get(`/api/games/${gameId}`);
        setGame(gameResponse.data);
        
        // Initialize edit form with game data
        setEditForm({
          title: gameResponse.data.title,
          description: gameResponse.data.description || '',
          accessCode: gameResponse.data.accessCode,
          isActive: gameResponse.data.isActive,
          endTime: gameResponse.data.endTime 
            ? new Date(gameResponse.data.endTime).toISOString().slice(0, 16)
            : ''
        });
        
        // Get teams for this game
        const teamsResponse = await api.get(`/api/games/${gameId}/teams`);
        setTeams(teamsResponse.data);
        
        // Get tasks for this game - FIXED
        const tasksResponse = await api.get(`/api/games/${gameId}/tasks`);
        setTasks(tasksResponse.data);
        
        // Get submissions for this game
        const submissionsResponse = await api.get(`/api/games/${gameId}/submissions`);
        setSubmissions(submissionsResponse.data);
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Der opstod en fejl ved hentning af spildata');
        navigate('/admin/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId, navigate]);
  
  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle game update
  const handleUpdateGame = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Format game data
      const gameData = {
        ...editForm,
        // Convert empty string to null for endTime
        endTime: editForm.endTime || null
      };
      
      // Update game - FIXED
      const response = await api.put(`/api/games/${gameId}`, gameData);
      
      // Update local state
      setGame(response.data);
      
      toast.success('Spil opdateret!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved opdatering af spillet');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle game deletion
  const handleDeleteGame = async () => {
    try {
      setIsSubmitting(true);
      // FIXED
      await api.delete(`/api/games/${gameId}`);
      toast.success('Spil slettet!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved sletning af spillet');
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Er du sikker på, at du vil slette denne opgave?')) {
      try {
        setIsSubmitting(true);
        // FIXED
        await api.delete(`/api/tasks/${taskId}`);
        // Update the tasks list by filtering out the deleted task
        setTasks(tasks.filter(t => t._id !== taskId));
        toast.success('Opgave slettet!');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Der opstod en fejl ved sletning af opgaven');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Toggle game active status
  const toggleGameStatus = async () => {
    try {
      const currentStatus = game.isActive;
      
      // Optimistically update UI
      setGame({ ...game, isActive: !currentStatus });
      
      // Make API call - FIXED
      await api.put(`/api/games/${gameId}`, { isActive: !currentStatus });
      
      toast.success(currentStatus ? 'Spil deaktiveret!' : 'Spil aktiveret!');
    } catch (error) {
      // Revert UI if API call fails
      setGame({ ...game, isActive: game.isActive });
      console.error('Error toggling game status:', error);
      toast.error('Der opstod en fejl ved ændring af spilstatus');
    }
  };
  
  // Calculate statistics
  const calculateStats = () => {
    if (!game || !teams || !submissions) return null;
    
    const pendingSubmissions = submissions.filter(s => !s.isEvaluated);
    
    return {
      teamCount: teams.length,
      taskCount: tasks.length,
      submissionCount: submissions.length,
      pendingCount: pendingSubmissions.length,
      participantCount: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)
    };
  };
  
  const stats = calculateStats();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Indlæser spildata...</p>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Spil ikke fundet</h2>
        <p className="text-gray-600 mb-6">Det valgte spil findes ikke eller du har ikke adgang til det.</p>
        <Link to="/admin/dashboard" className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">
          Tilbage til dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-blue-900">{game.title}</h1>
            <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
              game.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {game.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
          <p className="text-gray-600">Adgangskode: <span className="font-mono">{game.accessCode}</span></p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3">
          <Link 
            to="/admin/dashboard"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Tilbage
          </Link>
          
          <div className="relative">
            <button 
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              onClick={() => setShowEditModal(true)}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Rediger spil
            </button>
          </div>
        </div>
      </div>
      
      {/* Game statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-sm text-gray-500">Hold</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.teamCount || 0}</span>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-sm text-gray-500">Opgaver</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.taskCount || 0}</span>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-sm text-gray-500">Deltagere</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.participantCount || 0}</span>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-sm text-gray-500">Besvarelser</span>
          <span className="text-2xl font-bold text-gray-900">{stats?.submissionCount || 0}</span>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-sm text-gray-500">Afventer</span>
          <span className="text-2xl font-bold text-amber-600">{stats?.pendingCount || 0}</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Link 
          to={`/create-task/${gameId}`}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Opret ny opgave
        </Link>
        
        <button
          onClick={toggleGameStatus}
          disabled={isSubmitting}
          className={`font-bold py-2 px-4 rounded flex items-center ${
            game.isActive 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {game.isActive ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Deaktiver spil
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Aktiver spil
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Slet spil
        </button>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-md">
        <div className="flex border-b">
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'overview' 
                ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overblik
          </button>
          
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'tasks' 
                ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            Opgaver
          </button>
          
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'teams' 
                ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('teams')}
          >
            Hold
          </button>
          
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'submissions' 
                ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('submissions')}
          >
            Besvarelser
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="bg-white p-6 rounded-b-lg shadow-md mb-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Spil detaljer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Titel</p>
                <p className="text-gray-900">{game.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Adgangskode</p>
                <p className="text-gray-900 font-mono">{game.accessCode}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${game.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    {game.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Oprettet</p>
                <p className="text-gray-900">
                  {new Date(game.createdAt).toLocaleDateString('da-DK', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Startdato</p>
                <p className="text-gray-900">
                  {new Date(game.startTime).toLocaleDateString('da-DK', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {game.endTime && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Slutdato</p>
                  <p className="text-gray-900">
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
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Beskrivelse</p>
                <p className="text-gray-900 whitespace-pre-line">{game.description || 'Ingen beskrivelse'}</p>
              </div>
            </div>
            
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Sådan gør deltagerne</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Deltagere skal gøre følgende for at tilslutte sig dette spil:
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Log ind på systemet</li>
                  <li>Vælg "Find spil" fra menuen</li>
                  <li>Indtast adgangskoden: <span className="font-mono font-medium">{game.accessCode}</span></li>
                  <li>Opret et hold eller tilslut et eksisterende hold</li>
                  <li>Begynd at løse opgaver og optjen point</li>
                </ol>
              </div>
            </div>
          </div>
        )}
        
        {/* Tasks tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Opgaver ({tasks?.length || 0})</h2>
              
              <Link 
                to={`/create-task/${gameId}`}
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-bold py-1 px-3 rounded flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Tilføj opgave
              </Link>
            </div>
            
            {tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => {
                  const taskSubmissions = submissions?.filter(s => s.task?._id === task._id) || [];
                  const pendingSubmissions = taskSubmissions.filter(s => !s.isEvaluated) || [];
                  const completedSubmissions = taskSubmissions.filter(s => s.isEvaluated) || [];
                  
                  return (
                    <div key={task._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-lg text-gray-900">{task.title}</h3>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${task.type === 'multiple_choice' ? 'bg-green-100 text-green-800' : ''}
                              ${task.type === 'text' ? 'bg-blue-100 text-blue-800' : ''}
                              ${task.type === 'video' ? 'bg-purple-100 text-purple-800' : ''}
                            `}>
                              {task.type === 'multiple_choice' ? 'Multiple choice' : ''}
                              {task.type === 'text' ? 'Tekstbesvarelse' : ''}
                              {task.type === 'video' ? 'Videobesvarelse' : ''}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">{task.category}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div>
                              <span className="block text-xs text-gray-500">Risiko</span>
                              <span className="text-red-600 font-medium">-{task.riskPoints}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Belønning</span>
                              <span className="text-green-600 font-medium">+{task.rewardPoints}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Tid</span>
                              <span className="text-gray-700">{task.timeLimit} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-500">
                          {taskSubmissions.length} besvarelser 
                          {pendingSubmissions.length > 0 && (
                            <span className="text-amber-600 ml-1">
                              ({pendingSubmissions.length} afventer bedømmelse)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link 
                            to={`/edit-task/${task._id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Rediger
                          </Link>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Slet
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">Der er ingen opgaver oprettet til dette spil endnu.</p>
                <Link 
                  to={`/create-task/${gameId}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Opret den første opgave
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Teams tab */}
        {activeTab === 'teams' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hold ({teams?.length || 0})</h2>
            
            {teams && teams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Holdnavn
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medlemmer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Point
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opgaver løst
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Handling
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams
                      .sort((a, b) => (b.points || 0) - (a.points || 0))
                      .map((team) => {
                        const teamSubmissions = submissions?.filter(s => s.team?._id === team._id) || [];
                        const completedSubmissions = teamSubmissions.filter(s => s.isEvaluated) || [];
                        
                        return (
                          <tr key={team._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'person' : 'personer'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{team.points || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {completedSubmissions?.length || 0} af {tasks?.length || 0} opgaver
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link 
                                to={`/team-dashboard/${team._id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Detaljer
                              </Link>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Der er ingen hold tilsluttet til dette spil endnu.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Submissions tab */}
        {activeTab === 'submissions' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Besvarelser ({submissions?.length || 0})</h2>
            
            {submissions && submissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hold
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opgave
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indsendt
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Handling
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions
                      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
                      .map((submission) => {
                        // Find related team and task safely
                        const teamName = teams.find(t => t._id === submission.team?._id)?.name || 'Unknown Team';
                        const task = tasks.find(t => t._id === submission.task?._id);
                        const taskTitle = task?.title || 'Unknown Task';
                        const taskType = task?.type || 'unknown';
                        
                        return (
                          <tr key={submission._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{teamName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{taskTitle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${taskType === 'multiple_choice' ? 'bg-green-100 text-green-800' : ''}
                                ${taskType === 'text' ? 'bg-blue-100 text-blue-800' : ''}
                                ${taskType === 'video' ? 'bg-purple-100 text-purple-800' : ''}
                              `}>
                                {taskType === 'multiple_choice' ? 'Multiple choice' : ''}
                                {taskType === 'text' ? 'Tekst' : ''}
                                {taskType === 'video' ? 'Video' : ''}
                                {taskType === 'unknown' ? 'Ukendt' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {submission.isEvaluated ? (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  submission.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {submission.isCorrect ? 'Korrekt' : 'Forkert'}
                                  {' '}
                                  ({submission.pointsEarned >= 0 ? '+' : ''}{submission.pointsEarned})
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                  Afventer bedømmelse
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {submission.submittedAt ? 
                                  new Date(submission.submittedAt).toLocaleDateString('da-DK', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Ukendt dato'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {!submission.isEvaluated ? (
                                <Link 
                                  to={`/evaluate-submission/${submission._id}`}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Bedøm
                                </Link>
                              ) : (
                                <Link 
                                  to={`/submission-detail/${submission._id}`}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  Se detaljer
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Der er ingen besvarelser til dette spil endnu.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit game modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Rediger spil</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateGame}>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                    Spiltitel
                  </label>
                  <input
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="title"
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Beskrivelse
                  </label>
                  <textarea
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="description"
                    name="description"
                    rows="4"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accessCode">
                    Adgangskode
                  </label>
                  <input
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono"
                    id="accessCode"
                    type="text"
                    name="accessCode"
                    value={editForm.accessCode}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endTime">
                    Slutdato (valgfri)
                  </label>
                  <input
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="endTime"
                    type="datetime-local"
                    name="endTime"
                    value={editForm.endTime}
                    onChange={handleEditFormChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lad være tom for at holde spillet aktivt uden tidsbegrænsning.
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      type="checkbox"
                      name="isActive"
                      checked={editForm.isActive}
                      onChange={handleEditFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Aktiver spillet
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  disabled={isSubmitting}
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Gemmer...' : 'Gem ændringer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Bekræft sletning</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Er du sikker på, at du vil slette spillet <span className="font-medium">{game.title}</span>?
              </p>
              <p className="text-gray-700 mt-2">
                Dette vil slette alle opgaver, besvarelser og holddata relateret til dette spil.
                Denne handling kan ikke fortrydes.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                disabled={isSubmitting}
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={handleDeleteGame}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sletter...' : 'Slet spil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManage;
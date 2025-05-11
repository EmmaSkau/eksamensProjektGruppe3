import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';

const GameStatistics = () => {
  const { gameId } = useParams();
  
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch game statistics
  useEffect(() => {
    const fetchGameStatistics = async () => {
      try {
        setIsLoading(true);
        
        // Get game details
        const gameResponse = await api.get(`/api/games/${gameId}`);
        setGame(gameResponse.data);
        
        // Get teams for this game
        const teamsResponse = await api.get(`/api/games/${gameId}/teams`);
        setTeams(teamsResponse.data);
        
        // Get tasks for this game
        const tasksResponse = await api.get(`/api/games/${gameId}/tasks`);
        setTasks(tasksResponse.data);
        
        // Get submissions for this game
        const submissionsResponse = await api.get(`/api/games/${gameId}/submissions`);
        setSubmissions(submissionsResponse.data);
        
        // Get reflections for this game
        const reflectionsResponse = await api.get(`/api/games/${gameId}/reflections`);
        setReflections(reflectionsResponse.data);
      } catch (error) {
        console.error('Error fetching game statistics:', error);
        toast.error('Der opstod en fejl ved hentning af spilstatistik');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameStatistics();
  }, [gameId]);
  
  // Calculate statistics
  const calculateStatistics = () => {
    if (!game || teams.length === 0 || tasks.length === 0) return null;
    
    // Team statistics
    const teamStats = teams.map(team => {
      const teamSubmissions = submissions.filter(s => {
        // Handle both populated and non-populated references
        const teamId = typeof s.team === 'object' ? s.team._id : s.team;
        return teamId === team._id;
      });
      const evaluatedSubmissions = teamSubmissions.filter(s => s.isEvaluated);
      const correctSubmissions = evaluatedSubmissions.filter(s => s.isCorrect);
      
      return {
        ...team,
        submissionCount: teamSubmissions.length,
        evaluatedCount: evaluatedSubmissions.length,
        correctCount: correctSubmissions.length,
        incorrectCount: evaluatedSubmissions.length - correctSubmissions.length,
        pendingCount: teamSubmissions.length - evaluatedSubmissions.length,
        successRate: evaluatedSubmissions.length > 0 
          ? (correctSubmissions.length / evaluatedSubmissions.length) * 100 
          : 0
      };
    });
    
    // Task statistics
    const taskStats = tasks.map(task => {
      const taskSubmissions = submissions.filter(s => {
        // Handle both populated and non-populated references
        const taskId = typeof s.task === 'object' ? s.task._id : s.task;
        return taskId === task._id;
      });
      const evaluatedSubmissions = taskSubmissions.filter(s => s.isEvaluated);
      const correctSubmissions = evaluatedSubmissions.filter(s => s.isCorrect);
      
      return {
        ...task,
        submissionCount: taskSubmissions.length,
        evaluatedCount: evaluatedSubmissions.length,
        correctCount: correctSubmissions.length,
        incorrectCount: evaluatedSubmissions.length - correctSubmissions.length,
        pendingCount: taskSubmissions.length - evaluatedSubmissions.length,
        successRate: evaluatedSubmissions.length > 0 
          ? (correctSubmissions.length / evaluatedSubmissions.length) * 100 
          : 0,
        averagePoints: evaluatedSubmissions.length > 0
          ? evaluatedSubmissions.reduce((sum, s) => sum + s.pointsEarned, 0) / evaluatedSubmissions.length
          : 0
      };
    });
    
    // Game overview statistics
    const totalSubmissions = submissions.length;
    const evaluatedSubmissions = submissions.filter(s => s.isEvaluated);
    const correctSubmissions = evaluatedSubmissions.filter(s => s.isCorrect);
    
    const overviewStats = {
      totalTeams: teams.length,
      totalTasks: tasks.length,
      totalSubmissions,
      evaluatedSubmissions: evaluatedSubmissions.length,
      pendingSubmissions: totalSubmissions - evaluatedSubmissions.length,
      correctSubmissions: correctSubmissions.length,
      incorrectSubmissions: evaluatedSubmissions.length - correctSubmissions.length,
      averageTeamSize: teams.reduce((sum, team) => sum + (team.members?.length || 0), 0) / (teams.length || 1),
      averageSubmissionsPerTeam: totalSubmissions / (teams.length || 1),
      successRate: evaluatedSubmissions.length > 0 
        ? (correctSubmissions.length / evaluatedSubmissions.length) * 100 
        : 0
    };
    
    return {
      teamStats,
      taskStats,
      overviewStats
    };
  };
  
  const statistics = calculateStatistics();
  
  // Handle export data
  const handleExportData = async () => {
    try {
      const response = await api.get(`/api/admin/export/games/${gameId}`, {
        responseType: 'blob' // Important for handling binary data like CSV files
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${game.title.replace(/\s+/g, '-').toLowerCase()}-data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Data eksporteret!');
    } catch (error) {
      console.error('Error exporting game data:', error);
      toast.error('Der opstod en fejl ved eksport af data');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!game || !statistics) {
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
          <h1 className="text-3xl font-bold text-blue-900">Spilstatistik</h1>
          <p className="text-gray-600">{game.title}</p>
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
          
          <button 
            onClick={handleExportData}
            className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Eksporter data
          </button>
        </div>
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
              activeTab === 'reflections' 
                ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('reflections')}
          >
            Refleksioner
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="bg-white p-6 rounded-b-lg shadow-md mb-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Spil overblik</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Deltagelse</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.totalTeams}</div>
                    <div className="text-sm text-gray-500">Hold</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.averageTeamSize.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Gns. holdstørrelse</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">Opgaver</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.totalTasks}</div>
                    <div className="text-sm text-gray-500">Opgaver i alt</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.averageSubmissionsPerTeam.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Gns. opgaver pr. hold</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Besvarelser</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.totalSubmissions}</div>
                    <div className="text-sm text-gray-500">Besvarelser i alt</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{statistics.overviewStats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Succesrate</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Besvarelsesstatus</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Korrekte</span>
                    <span className="text-sm font-medium text-green-800">
                      {statistics.overviewStats.correctSubmissions} ({statistics.overviewStats.evaluatedSubmissions > 0 ? (statistics.overviewStats.correctSubmissions / statistics.overviewStats.evaluatedSubmissions * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${statistics.overviewStats.totalSubmissions > 0 ? statistics.overviewStats.correctSubmissions / statistics.overviewStats.totalSubmissions * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Forkerte</span>
                    <span className="text-sm font-medium text-red-800">
                      {statistics.overviewStats.incorrectSubmissions} ({statistics.overviewStats.evaluatedSubmissions > 0 ? (statistics.overviewStats.incorrectSubmissions / statistics.overviewStats.evaluatedSubmissions * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-red-600 h-2.5 rounded-full" 
                      style={{ width: `${statistics.overviewStats.totalSubmissions > 0 ? statistics.overviewStats.incorrectSubmissions / statistics.overviewStats.totalSubmissions * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Ventende</span>
                    <span className="text-sm font-medium text-amber-800">
                      {statistics.overviewStats.pendingSubmissions} ({statistics.overviewStats.totalSubmissions > 0 ? (statistics.overviewStats.pendingSubmissions / statistics.overviewStats.totalSubmissions * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full" 
                      style={{ width: `${statistics.overviewStats.totalSubmissions > 0 ? statistics.overviewStats.pendingSubmissions / statistics.overviewStats.totalSubmissions * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Spildetaljer</h3>
              
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
                  <p className="text-sm text-gray-600 mb-1">Oprettet af</p>
                  <p className="text-gray-900">{game.createdBy?.username || 'Ukendt'}</p>
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
                  <p className="text-gray-900">{game.description || 'Ingen beskrivelse'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Teams tab */}
        {activeTab === 'teams' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Hold ({statistics.teamStats.length})</h2>
            
            {statistics.teamStats.length > 0 ? (
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Succesrate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statistics.teamStats
                      .sort((a, b) => b.points - a.points)
                      .map((team, index) => (
                        <tr key={team._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-6 w-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{team.members?.length || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{team.points}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {team.evaluatedCount} af {team.submissionCount}
                              {team.pendingCount > 0 && (
                                <span className="ml-1 text-xs text-amber-600">
                                  ({team.pendingCount} afventer)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {team.successRate.toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen hold har tilsluttet sig spillet endnu.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Tasks tab */}
        {activeTab === 'tasks' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Opgaver ({statistics.taskStats.length})</h2>
            
            {statistics.taskStats.length > 0 ? (
              <div className="space-y-6">
                {statistics.taskStats.map(task => (
                  <div key={task._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${task.type === 'multiple_choice' ? 'bg-green-100 text-green-800' : ''}
                            ${task.type === 'text' ? 'bg-blue-100 text-blue-800' : ''}
                            ${task.type === 'video' ? 'bg-purple-100 text-purple-800' : ''}
                          `}>
                            {task.type === 'multiple_choice' ? 'Multiple choice' : ''}
                            {task.type === 'text' ? 'Tekstbesvarelse' : ''}
                            {task.type === 'video' ? 'Videobesvarelse' : ''}
                          </span>
                          <span className="ml-3">{task.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex mt-2 md:mt-0">
                        <div className="text-center px-3">
                          <div className="text-sm text-gray-500">Risiko</div>
                          <div className="text-sm font-medium text-red-700">{task.riskPoints}</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="text-sm text-gray-500">Belønning</div>
                          <div className="text-sm font-medium text-green-700">{task.rewardPoints}</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="text-sm text-gray-500">Tid</div>
                          <div className="text-sm font-medium">{task.timeLimit} min</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Korrekte: {task.correctCount}</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Forkerte: {task.incorrectCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Afventer: {task.pendingCount}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className="flex h-2.5 rounded-full">
                        <div 
                          className="bg-green-500 h-2.5" 
                          style={{ width: `${task.submissionCount > 0 ? task.correctCount / task.submissionCount * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-red-500 h-2.5" 
                          style={{ width: `${task.submissionCount > 0 ? task.incorrectCount / task.submissionCount * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-amber-500 h-2.5 rounded-r-full" 
                          style={{ width: `${task.submissionCount > 0 ? task.pendingCount / task.submissionCount * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Løst af {task.submissionCount} hold ({(task.submissionCount / teams.length * 100).toFixed(0)}%)</span>
                      <span>Gns. score: {task.averagePoints.toFixed(1)} point</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen opgaver er oprettet til dette spil endnu.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Reflections tab */}
        {activeTab === 'reflections' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Refleksioner</h2>
            
            {reflections.length > 0 ? (
              <div>
                {/* Group reflections by team */}
                {teams.map(team => {
                  const teamReflections = reflections.filter(r => {
                    // Handle both populated and non-populated references
                    const reflectionTeamId = typeof r.team === 'object' ? r.team._id : r.team;
                    return reflectionTeamId === team._id;
                  });
                  
                  if (teamReflections.length === 0) return null;
                  
                  return (
                    <div key={team._id} className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {team.name}
                      </h3>
                      
                      <div className="space-y-6">
                        {teamReflections.map(reflection => (
                          <div key={reflection._id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              {reflection.question}
                            </div>
                            <div className="text-gray-900 whitespace-pre-line">
                              {reflection.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen hold har indsendt refleksioner endnu.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatistics;
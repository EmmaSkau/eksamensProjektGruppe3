import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const TaskSolve = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [team, setTeam] = useState(null);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  
  // Fetch task data and user's team
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching task with ID:', taskId);
        
        // Get task details
        const taskResponse = await api.get(`/api/tasks/${taskId}`);
        console.log('Task data:', taskResponse.data);
        const taskData = taskResponse.data;
        setTask(taskData);
        
        // Find user's team for this game
        const teamsResponse = await api.get('/api/teams/user');
        console.log('User teams:', teamsResponse.data);
        
        const userTeamForGame = teamsResponse.data.find(team => 
          team.game && (
            // Handle both populated and non-populated game references
            team.game._id === taskData.game._id || 
            team.game === taskData.game._id
          )
        );
        
        if (userTeamForGame) {
          console.log('User team for this game:', userTeamForGame);
          setTeam(userTeamForGame);
          
          // Check if task is already submitted
          const submissionsResponse = await api.get(`/api/teams/${userTeamForGame._id}/submissions`);
          console.log('Team submissions:', submissionsResponse.data);
          
          const alreadySubmitted = submissionsResponse.data.some(submission => 
            submission.task._id === taskId || submission.task === taskId
          );
          
          if (alreadySubmitted) {
            toast.info('Denne opgave er allerede løst');
            navigate(`/tasks/${taskData.game._id}`);
            return;
          }
          
          // Initialize timer
          const timeLimit = taskData.timeLimit || 15; // Default to 15 minutes if not specified
          setTimeLeft(timeLimit * 60); // Convert to seconds
        } else {
          console.log('User does not have a team for this game');
          toast.error('Du skal først være medlem af et hold i dette spil');
          navigate(`/tasks/${taskData.game._id}`);
        }
      } catch (error) {
        console.error('Error fetching task data:', error);
        toast.error('Der opstod en fejl ved hentning af opgaven');
        navigate('/join-game');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTaskData();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [taskId, navigate]);
  
  // Start timer after loading
  useEffect(() => {
    if (!isLoading && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            toast.error('Tiden er udløbet!');
            navigate(`/tasks/${task.game._id}`);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, task, navigate, timeLeft]);
  
  // Handle file selection for video tasks
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.includes('video/')) {
      toast.error('Vælg venligst en videofil');
      return;
    }
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Filen er for stor. Maksimal størrelse er 100 MB');
      return;
    }
    
    setVideoFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear timer
    clearInterval(timerRef.current);
    
    if (!team) {
      toast.error('Du skal være medlem af et hold for at indsende svar');
      return;
    }
    
    if (task.type === 'multiple_choice' && !selectedOption) {
      toast.error('Vælg venligst et svar');
      return;
    }
    
    if (task.type === 'text' && !answer.trim()) {
      toast.error('Indtast venligst et svar');
      return;
    }
    
    if (task.type === 'video' && !videoFile) {
      toast.error('Upload venligst en video');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let submissionData;
      let response;
      
      // Submit based on task type
      if (task.type === 'multiple_choice') {
        submissionData = {
          task: taskId,
          team: team._id,
          answer: selectedOption
        };
        
        response = await api.post('/api/submissions', submissionData);
      } else if (task.type === 'text') {
        submissionData = {
          task: taskId,
          team: team._id,
          answer: answer
        };
        
        response = await api.post('/api/submissions', submissionData);
      } else if (task.type === 'video') {
        // For video submissions, use FormData
        const formData = new FormData();
        formData.append('task', taskId);
        formData.append('team', team._id);
        formData.append('file', videoFile);
        
        response = await api.post('/api/submissions', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      console.log('Submission response:', response.data);
      
      // Show success message
      toast.success('Svar indsendt!');
      
      // Navigate back to task list
      navigate(`/tasks/${task.game._id}`);
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      // Restart timer
      setTimeLeft(prevTime => {
        timerRef.current = setInterval(() => {
          setTimeLeft(time => {
            if (time <= 1) {
              clearInterval(timerRef.current);
              toast.error('Tiden er udløbet!');
              navigate(`/tasks/${task.game._id}`);
              return 0;
            }
            return time - 1;
          });
        }, 1000);
        return prevTime;
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Der opstod en fejl ved indsendelse af svar');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Opgave ikke fundet</h2>
        <p className="text-gray-600 mb-6">Den valgte opgave findes ikke eller du har ikke adgang til den.</p>
        <Link to="/join-game" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
          Tilbage til Find spil
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Task header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="p-6 md:p-8 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
            <p className="text-gray-600 mb-4">
              <span className="inline-block bg-gray-100 text-gray-800 text-sm rounded px-2 py-1 mr-2">
                {task.category}
              </span>
              <span className="text-sm">
                {task.type === 'multiple_choice' ? 'Multiple choice opgave' : 
                 task.type === 'text' ? 'Tekstopgave' : 'Videoopgave'}
              </span>
            </p>
            <div className="text-gray-700 prose">
              {task.description}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 md:p-8 flex flex-row md:flex-col items-center justify-center md:w-56">
            {timeLeft !== null && (
              <>
                <div className="text-sm uppercase tracking-wide opacity-80 mr-4 md:mr-0 md:mb-2">Tid tilbage</div>
                <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
              </>
            )}
            <div className="flex flex-col mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="opacity-80">Risiko:</div>
                <div>{task.riskPoints} point</div>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <div className="opacity-80">Belønning:</div>
                <div>{task.rewardPoints} point</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task answer form */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Dit svar</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Multiple choice form */}
            {task.type === 'multiple_choice' && (
              <div className="space-y-4 mb-6">
                {task.options.map((option, index) => (
                  <div key={index}>
                    <label 
                      className={`block border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedOption === option ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedOption(option)}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 border rounded-full flex items-center justify-center mr-3 ${
                          selectedOption === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {selectedOption === option && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">{option}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {/* Text answer form */}
            {task.type === 'text' && (
              <div className="mb-6">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Skriv dit svar her..."
                  className="w-full border border-gray-300 rounded-lg p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
            )}
            
            {/* Video upload form */}
            {task.type === 'video' && (
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {!videoPreview ? (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Klik for at vælge en videofil eller træk og slip filen her
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Max 100 MB
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </>
                  ) : (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={videoPreview}
                        className="w-full rounded"
                        controls
                      ></video>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  {videoFile ? `Valgt fil: ${videoFile.name}` : 'Ingen fil valgt'}
                </p>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end pt-4 border-t border-gray-100">
              <Link
                to={`/tasks/${task.game._id}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg mb-3 sm:mb-0 sm:mr-3 text-center hover:bg-gray-50 transition-colors"
              >
                Annuller
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Indsender svar...' : 'Indsend svar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskSolve;
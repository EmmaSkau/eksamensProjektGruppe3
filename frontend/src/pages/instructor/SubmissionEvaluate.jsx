import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService, { api } from '../../utils/api';
import { toast } from 'react-toastify';

const SubmissionEvaluate = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [task, setTask] = useState(null);
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Evaluation form state
  const [evaluation, setEvaluation] = useState({
    isCorrect: true,
    pointsEarned: 0,
    feedback: ''
  });
  
  // Fetch submission, task, and team data
  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        setIsLoading(true);
        
        // Get submission details
        const submissionResponse = await api.submissions.getById(submissionId);
        setSubmission(submissionResponse.data);
        
        // Get task details
        const taskResponse = await api.tasks.getById(submissionResponse.data.task);
        setTask(taskResponse.data);
        
        // Get team details
        const teamResponse = await api.teams.getById(submissionResponse.data.team);
        setTeam(teamResponse.data);
        
        // Initialize evaluation state
        setEvaluation({
          isCorrect: true,
          pointsEarned: taskResponse.data.rewardPoints,
          feedback: ''
        });
      } catch (error) {
        console.error('Error fetching submission data:', error);
        toast.error('Der opstod en fejl ved hentning af besvarelse');
        navigate('/instructor/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissionData();
  }, [submissionId, navigate]);
  
  // Handle evaluation input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isCorrect') {
      // Update correctness and adjust points automatically
      const isCorrect = checked;
      setEvaluation(prev => ({
        ...prev,
        isCorrect,
        pointsEarned: isCorrect ? task.rewardPoints : -task.riskPoints
      }));
    } else if (name === 'pointsEarned' && type === 'number') {
      // Allow custom point values
      const points = parseInt(value);
      setEvaluation(prev => ({
        ...prev,
        pointsEarned: isNaN(points) ? 0 : points
      }));
    } else {
      setEvaluation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle evaluation submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Update submission with evaluation
      await api.submissions.update(submissionId, {
        isEvaluated: true,
        isCorrect: evaluation.isCorrect,
        pointsEarned: evaluation.pointsEarned,
        feedback: evaluation.feedback
      });
      
      toast.success('Bedømmelse gemt!');
      
      // Navigate back to instructor dashboard
      navigate('/instructor/dashboard');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved indsendelse af bedømmelsen');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Indlæser besvarelse...</p>
      </div>
    );
  }
  
  if (!submission || !task || !team) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Besvarelse ikke fundet</h2>
        <p className="text-gray-600 mb-6">Den valgte besvarelse findes ikke eller du har ikke adgang til den.</p>
        <Link to="/instructor/dashboard" className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">
          Tilbage til dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Bedøm besvarelse</h1>
          <p className="text-gray-600">
            Opgave: {task.title} | Hold: {team.name}
          </p>
        </div>
        
        <Link 
          to="/instructor/dashboard"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Tilbage til dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Task details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Opgavedetaljer</h2>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Kategori</span>
            <span className="text-gray-900">{task.category}</span>
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Beskrivelse</span>
            <p className="text-gray-900 whitespace-pre-line">{task.description}</p>
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Type</span>
            <span className="text-gray-900">
              {task.type === 'multiple_choice' ? 'Multiple choice' : ''}
              {task.type === 'text' ? 'Tekstbesvarelse' : ''}
              {task.type === 'video' ? 'Videobesvarelse' : ''}
            </span>
          </div>
          
          {task.type === 'multiple_choice' && (
            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-500">Korrekt svar</span>
              <span className="text-green-600 font-medium">{task.correctAnswer}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-gray-500">Risiko</span>
              <span className="text-red-600 font-medium">{task.riskPoints} point</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Belønning</span>
              <span className="text-green-600 font-medium">{task.rewardPoints} point</span>
            </div>
          </div>
        </div>
        
        {/* Submission details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Besvarelse</h2>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Indsendt</span>
            <span className="text-gray-900">
              {new Date(submission.submittedAt).toLocaleDateString('da-DK', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Hold</span>
            <div className="flex items-center">
              <span className="text-gray-900">{team.name}</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {team.points} point
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-500">Svar</span>
            
            {task.type === 'multiple_choice' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <span className={`font-medium ${
                  submission.answer === task.correctAnswer ? 'text-green-600' : 'text-red-600'
                }`}>
                  {submission.answer}
                </span>
                
                {submission.answer !== task.correctAnswer && (
                  <div className="text-xs text-gray-500 mt-1">
                    Korrekt svar: <span className="text-green-600">{task.correctAnswer}</span>
                  </div>
                )}
              </div>
            )}
            
            {task.type === 'text' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md whitespace-pre-line">
                {submission.answer}
              </div>
            )}
            
            {task.type === 'video' && submission.fileUrl && (
              <div className="mt-2">
                <video 
                  controls 
                  className="w-full rounded-md"
                  src={submission.fileUrl}
                >
                  Din browser understøtter ikke videoafspilning.
                </video>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Evaluation form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bedømmelse</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                id="isCorrect"
                type="checkbox"
                name="isCorrect"
                checked={evaluation.isCorrect}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isCorrect" className="ml-2 block text-sm font-medium text-gray-700">
                Korrekt besvarelse
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pointsEarned">
                Tildelte point
              </label>
              <input
                className="appearance-none border rounded w-full max-w-xs py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="pointsEarned"
                type="number"
                name="pointsEarned"
                value={evaluation.pointsEarned}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard: {evaluation.isCorrect ? `+${task.rewardPoints}` : `-${task.riskPoints}`} point
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="feedback">
                Feedback til holdet (valgfrit)
              </label>
              <textarea
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="feedback"
                name="feedback"
                rows="4"
                placeholder="Giv holdet konstruktiv feedback på deres besvarelse..."
                value={evaluation.feedback}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Link
              to="/instructor/dashboard"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Annuller
            </Link>
            
            <button
              type="submit"
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Gemmer bedømmelse...' : 'Gem bedømmelse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionEvaluate;
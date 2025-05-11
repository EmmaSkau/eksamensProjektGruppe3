import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiService, { api } from '../../utils/api';
import { toast } from 'react-toastify';

const TaskCreate = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    riskPoints: 5,
    rewardPoints: 10,
    timeLimit: 15,
    category: 'Ledelse'
  });
  
  // List of categories for dropdown
  const categories = [
    'Ledelse',
    'Kommunikation',
    'Planlægning',
    'Teambuilding',
    'Beslutningstagning',
    'Konfliktløsning',
    'Problemløsning',
    'Strategi',
    'Taktik',
    'Kreativitet'
  ];
  
  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        // Updated API call to use direct api.get
        const response = await api.get(`/api/games/${gameId}`);
        setGame(response.data);
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Der opstod en fejl ved hentning af spildata');
        navigate('/admin/dashboard'); // Updated to admin dashboard
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // Ensure number inputs have valid values
      const numValue = parseInt(value);
      const minValue = name === 'timeLimit' ? 1 : 0;
      const maxValue = name === 'timeLimit' ? 180 : 100;
      
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(minValue, Math.min(numValue || minValue, maxValue))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle option changes for multiple choice
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };
  
  // Add a new option for multiple choice
  const addOption = () => {
    if (formData.options.length < 8) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };
  
  // Remove an option for multiple choice
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const updatedOptions = formData.options.filter((_, i) => i !== index);
      
      setFormData(prev => ({
        ...prev,
        options: updatedOptions,
        // Reset correctAnswer if the removed option was selected
        correctAnswer: prev.correctAnswer === prev.options[index] ? '' : prev.correctAnswer
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Indtast venligst en opgavetitel');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Indtast venligst en opgavebeskrivelse');
      return;
    }
    
    if (formData.type === 'multiple_choice') {
      // Validate multiple choice options
      const nonEmptyOptions = formData.options.filter(opt => opt.trim() !== '');
      
      if (nonEmptyOptions.length < 2) {
        toast.error('Indtast venligst mindst to svarmuligheder');
        return;
      }
      
      if (!formData.correctAnswer) {
        toast.error('Vælg venligst det korrekte svar');
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Format data for API
      const taskData = {
        ...formData,
        game: gameId,
        // Filter out empty options for multiple choice
        options: formData.type === 'multiple_choice' 
          ? formData.options.filter(opt => opt.trim() !== '')
          : []
      };
      
      // Updated API call to use direct api.post
      await api.post('/api/tasks', taskData);
      
      toast.success('Opgave oprettet!');
      
      // Navigate back to game management - UPDATED PATH TO MATCH API FORMAT IN OTHER COMPONENTS
      navigate(`/admin/games/${gameId}`);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved oprettelse af opgaven');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Indlæser...</p>
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Opret ny opgave</h1>
          <p className="text-gray-600">Til spillet: {game.title}</p>
        </div>
        
        <Link 
          to={`/admin/games/${gameId}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Tilbage til spil
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSubmit}>
          {/* Basic task details */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Opgavedetaljer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Opgavetitel *
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Indtast opgavetitel"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Kategori
                </label>
                <select
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Opgavebeskrivelse *
              </label>
              <textarea
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                name="description"
                rows="5"
                placeholder="Beskriv opgaven for deltagerne"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                  Opgavetype *
                </label>
                <select
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="text">Tekstbesvarelse</option>
                  <option value="video">Videobesvarelse</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeLimit">
                  Tidsbegrænsning (min) *
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="timeLimit"
                  type="number"
                  name="timeLimit"
                  min="1"
                  max="180"
                  value={formData.timeLimit}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Points section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Point</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rewardPoints">
                  Belønningspoint *
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="rewardPoints"
                  type="number"
                  name="rewardPoints"
                  min="0"
                  max="100"
                  value={formData.rewardPoints}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Point tildelt for korrekt besvarelse
                </p>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="riskPoints">
                  Risikopoint *
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="riskPoints"
                  type="number"
                  name="riskPoints"
                  min="0"
                  max="100"
                  value={formData.riskPoints}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Point fratrukket for forkert besvarelse
                </p>
              </div>
            </div>
          </div>
          
          {/* Multiple choice section */}
          {formData.type === 'multiple_choice' && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Svarmuligheder</h2>
              
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`correct-${index}`}
                      name="correctAnswer"
                      value={option}
                      checked={formData.correctAnswer === option}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={option.trim() === ''}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Svarmulighed ${index + 1}`}
                      className="flex-1 appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={formData.options.length <= 2}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addOption}
                disabled={formData.options.length >= 8}
                className="mt-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Tilføj svarmulighed
              </button>
            </div>
          )}
          
          {/* Submit buttons - ADDED THIS SECTION */}
          <div className="mt-8 flex justify-end space-x-4">
            <Link
              to={`/admin/games/${gameId}`}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Annuller
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Opretter...
                </span>
              ) : (
                'Gem opgave'
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              For multiple choice opgaver vil besvarelserne blive evalueret automatisk.
              For tekst- og videobesvarelser skal du manuelt bedømme svarene. 
              Risiko og belønningspoint hjælper deltagerne med at prioritere opgaver.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCreate;
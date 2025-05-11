import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const Reflection = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReflections, setExistingReflections] = useState([]);
  
  // Reflection form state
  const [reflectionForms, setReflectionForms] = useState([
    { question: 'Hvad var jeres største udfordring i spillet?', answer: '' },
    { question: 'Hvilke ledelseskompetencer har I trænet?', answer: '' },
    { question: 'Hvordan fungerede jeres teamsamarbejde?', answer: '' },
    { question: 'Hvad er jeres vigtigste læring fra opgaverne?', answer: '' },
    { question: 'Hvad ville I gøre anderledes næste gang?', answer: '' }
  ]);
  
  // Fetch game data, team, and existing reflections
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        // Get game details
        const gameResponse = await api.get(`/api/games/${gameId}`);
        setGame(gameResponse.data);
        
        // Get user's team for this game
        const userTeamsResponse = await api.get('/api/teams/user');
        const teamForGame = userTeamsResponse.data.find(t => 
          t.game && (t.game._id === gameId || t.game === gameId)
        );
        
        if (!teamForGame) {
          toast.error('Du har ikke adgang til dette spil');
          navigate('/join-game');
          return;
        }
        
        setTeam(teamForGame);
        
        // Get existing reflections
        const reflectionsResponse = await api.get(`/api/teams/${teamForGame._id}/reflections`);
        setExistingReflections(reflectionsResponse.data);
        
        // Pre-fill form with existing reflections
        if (reflectionsResponse.data.length > 0) {
          const updatedForms = [...reflectionForms];
          
          reflectionsResponse.data.forEach(reflection => {
            const formIndex = updatedForms.findIndex(form => form.question === reflection.question);
            
            if (formIndex !== -1) {
              updatedForms[formIndex].answer = reflection.answer;
            }
          });
          
          setReflectionForms(updatedForms);
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
  }, [gameId, navigate, reflectionForms]);
  
  // Handle form input change
  const handleAnswerChange = (index, value) => {
    const updatedForms = [...reflectionForms];
    updatedForms[index].answer = value;
    setReflectionForms(updatedForms);
  };
  
  // Submit reflections
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate forms
    const filledForms = reflectionForms.filter(form => form.answer.trim() !== '');
    
    if (filledForms.length === 0) {
      toast.error('Udfyld venligst mindst ét reflektionsspørgsmål');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit each filled reflection
      for (const form of filledForms) {
        // Check if this reflection already exists
        const existingReflection = existingReflections.find(r => r.question === form.question);
        
        if (existingReflection) {
          // Update existing reflection
          await api.put(`/api/reflections/${existingReflection._id}`, {
            answer: form.answer
          });
        } else {
          // Create new reflection
          await api.post('/api/reflections', {
            game: gameId,
            team: team._id,
            question: form.question,
            answer: form.answer
          });
        }
      }
      
      toast.success('Refleksioner gemt!');
      navigate(`/team-dashboard/${team._id}`);
    } catch (error) {
      console.error('Error submitting reflections:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved indsendelse af refleksioner');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!game || !team) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Spil ikke fundet</h2>
        <p className="text-gray-600 mb-6">Det valgte spil findes ikke eller du har ikke adgang til det.</p>
        <Link to="/join-game" className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">
          Tilbage til Find spil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-1">Refleksion</h1>
          <p className="text-gray-600">
            <Link to={`/team-dashboard/${team._id}`} className="text-blue-600 hover:text-blue-800">
              {team.name}
            </Link> - {game.title}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            to={`/team-dashboard/${team._id}`}
            className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Tilbage til holdsiden
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Holdets refleksioner</h2>
        
        <p className="text-gray-700 mb-6">
          Brug denne side til at reflektere over jeres læring og oplevelser i spillet.
          Jeres svar vil hjælpe jer med at bearbejde jeres erfaringer og vil give instruktøren
          indblik i jeres læringsproces.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {reflectionForms.map((form, index) => (
              <div key={index} className="border-b pb-6 last:border-0">
                <label className="block text-gray-700 font-medium mb-2" htmlFor={`reflection-${index}`}>
                  {form.question}
                </label>
                <textarea
                  id={`reflection-${index}`}
                  value={form.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Skriv jeres refleksioner her..."
                ></textarea>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-8">
            <Link
              to={`/team-dashboard/${team._id}`}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Annuller
            </Link>
            
            <button
              type="submit"
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded"
              disabled={submitting}
            >
              {submitting ? 'Gemmer...' : 'Gem refleksioner'}
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
              Refleksioner er fælles for hele holdet. Alle holdmedlemmer kan se og redigere svarene.
              Det er ikke nødvendigt at udfylde alle spørgsmål, men jo flere desto bedre grundlag for feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reflection;
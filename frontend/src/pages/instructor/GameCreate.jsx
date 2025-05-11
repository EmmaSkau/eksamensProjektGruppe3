import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService, { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const GameCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accessCode: generateRandomCode(6),
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
    isActive: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate a random access code
  function generateRandomCode(length) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding similar looking characters like 0,O,1,I
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // Generate a new access code
  const regenerateCode = (e) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      accessCode: generateRandomCode(6)
    }));
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission - UPDATED TO FIX API CALL
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Indtast venligst en spiltitel');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format data for API
      const gameData = {
        ...formData,
        // Convert empty string to null for endTime
        endTime: formData.endTime || null
      };
      
      // CHANGE: Use direct API call instead of api.games.create
      const response = await api.post('/api/games', gameData);
      
      toast.success('Spil oprettet!');
      
      // Navigate to game management page
      navigate(`/manage-game/${response.data._id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error(error.response?.data?.message || 'Der opstod en fejl ved oprettelse af spillet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Opret nyt spil</h1>
        
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
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Spiltitel *
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Indtast spiltitel"
                  value={formData.title}
                  onChange={handleChange}
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
                  rows="5"
                  placeholder="Beskriv spillet for deltagerne"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            
            {/* Right column */}
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accessCode">
                  Adgangskode
                </label>
                <div className="flex">
                  <input
                    className="appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono"
                    id="accessCode"
                    type="text"
                    name="accessCode"
                    value={formData.accessCode}
                    onChange={handleChange}
                    readOnly
                  />
                  <button
                    onClick={regenerateCode}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r"
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deltagere vil bruge denne kode til at tilslutte sig spillet.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startTime">
                  Startdato
                </label>
                <input
                  className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="startTime"
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
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
                  value={formData.endTime}
                  onChange={handleChange}
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
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Aktiver spillet med det samme
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6 mt-6 flex justify-between">
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
              {isSubmitting ? 'Opretter...' : 'Opret spil'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Efter du har oprettet spillet, kan du tilføje opgaver og administrere hold.
              Deltagere kan tilslutte sig spillet ved hjælp af adgangskoden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCreate;
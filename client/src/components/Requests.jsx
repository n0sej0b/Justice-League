import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Requests.css';
import { getHeroes, getUserRequests, createRequest, updateRequest, deleteRequest, getHeroRequests } from "../API/Index";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Request = () => {
  const { user, isLoggedIn } = useAuth();
  const [heroes, setHeroes] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [error, setError] = useState(null);
  const [selectedHeroData, setSelectedHeroData] = useState(null);

  const [requestData, setRequestData] = useState({
    title: '',
    description: '',
    location: '',
    urgency: 'normal',
    contactInfo: '',
    selectedHero: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        // Fetch both heroes and user requests
        const [heroesData, userRequestsData] = await Promise.all([
          getHeroes(),
          isLoggedIn ? getUserRequests() : Promise.resolve([])
        ]);
        
        setHeroes(heroesData);
        setUserRequests(userRequestsData);
        
      } catch (error) {
        setError(error.message || 'Failed to fetch data');
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleHeroSelect = (hero) => {
    console.log('Selected hero:', hero);
    setSelectedHeroData(hero);
    setRequestData(prevState => ({
      ...prevState,
      selectedHero: hero.name
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      const newRequest = {
        title: requestData.title,
        description: requestData.description,
        location: requestData.location,
        urgency: requestData.urgency,
        contactInfo: requestData.contactInfo,
        hero_id: selectedHeroData.id
      };

      const createdRequest = await createRequest(newRequest);
      setUserRequests(prev => [...prev, createdRequest]);

      // Reset form
      setRequestData({
        title: '',
        description: '',
        location: '',
        urgency: 'normal',
        contactInfo: '',
        selectedHero: ''
      });
      setSelectedHeroData(null);

      alert('Request created successfully!');
    } catch (error) {
      setError(error.message || 'Failed to create request');
      console.error('Error creating request:', error);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/fallback-hero.png';
    return `${API_URL}/${imagePath}`;
  };

  return (
    <div className="requests-container">
      <h1>Request Hero Assistance</h1>
      
      {error && <div className="error-message">{error}</div>}

      {!requestData.selectedHero ? (
        <div className="heroes-grid">
          {heroes.map(hero => (
            <div 
              key={hero.id} 
              className="hero-card"
              onClick={() => handleHeroSelect(hero)}
            >
              <img 
                src={getImageUrl(hero.image)}
                alt={hero.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/fallback-hero.png';
                }}
              />
              <h3>{hero.name}</h3>
            </div>
          ))}
        </div>
      ) : (
        <div className="request-form-section">
          <div className="selected-hero-banner">
            {selectedHeroData && (
              <>
                <img 
                  src={getImageUrl(selectedHeroData.image)}
                  alt={selectedHeroData.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/fallback-hero.png';
                  }}
                />
                <h2>Request Form for {selectedHeroData.name}</h2>
                <button 
                  className="change-hero-btn"
                  onClick={() => {
                    setRequestData(prev => ({ ...prev, selectedHero: '' }));
                    setSelectedHeroData(null);
                  }}
                >
                  Change Hero
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="request-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={requestData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={requestData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={requestData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Urgency Level</label>
              <select
                id="urgency"
                name="urgency"
                value={requestData.urgency}
                onChange={handleChange}
                required
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contactInfo">Contact Information</label>
              <input
                type="text"
                id="contactInfo"
                name="contactInfo"
                value={requestData.contactInfo}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {isLoggedIn && (
        <div className="user-requests-section">
          <h2>Your Requests</h2>
          {userRequests.length > 0 ? (
            <div className="requests-grid">
              {userRequests.map(request => (
                <div key={request.id} className="request-card">
                  <h3>{request.title}</h3>
                  <p><strong>Status:</strong> {request.status}</p>
                  <p><strong>Location:</strong> {request.location}</p>
                  <p><strong>Description:</strong> {request.description}</p>
                  <p><strong>Urgency:</strong> {request.urgency}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No requests found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Request;

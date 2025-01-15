import React, { useState, useEffect } from 'react';
import './Requests.css';
import { getHeroes } from "../API/Index";


const Request = () => {
  const [heroes, setHeroes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const heroesData = await getHeroes();
        console.log('Fetched heroes:', heroesData);
        setHeroes(heroesData);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching heroes:', error);
      }
    };

    fetchHeroes();
  }, []);



  const [requestData, setRequestData] = useState({
    title: '',
    description: '',
    location: '',
    urgency: 'normal',
    contactInfo: '',
    selectedHero: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleHeroSelect = (heroName) => {
    setRequestData(prevState => ({
      ...prevState,
      selectedHero: heroName
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Request submitted:', requestData);
    // Reset form after submission
    setRequestData({
      title: '',
      description: '',
      location: '',
      urgency: 'normal',
      contactInfo: '',
      selectedHero: ''
    });
  };

  return (
    <div className="requests-container">
      <h1>Request Hero Assistance</h1>
      
      {!requestData.selectedHero ? (
        // Hero Selection Grid
        <div className="heroes-grid">
          {heroes.map(hero => (
            <div 
              key={hero.id} 
              className="hero-card"
              onClick={() => handleHeroSelect(hero.name)}
            >
              <img 
                src={`http://localhost:3000${hero.image}`} 
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
        // Request Form
        <div className="request-form-section">
          <div className="selected-hero-banner">
            <img 
              src={`http://localhost:3000${heroes.find(h => h.name === requestData.selectedHero)?.image}`}
              alt={requestData.selectedHero}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/fallback-hero.png';
              }}
            />
            <h2>Request Form for {requestData.selectedHero}</h2>
            <button 
              className="change-hero-btn"
              onClick={() => setRequestData(prev => ({ ...prev, selectedHero: '' }))}
            >
              Change Hero
            </button>
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
    </div>
  );
  
  
};

export default Request;

// src/components/Heroes.jsx
import React, { useState, useEffect } from 'react';
import { getHeroes } from "../API/Index";

const Heroes = ({ user, token }) => {
  const [heroes, setHeroes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const heroesData = await getHeroes();
        setHeroes(heroesData);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching heroes:', error);
      }
    };

    fetchHeroes();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="heroes-container">
      <h1>Review a Hero</h1>
      {heroes.length === 0 ? (
        <p>No heroes found.</p>
      ) : (
        <div className="heroes-grid">
          {heroes.map(hero => (
            <div key={hero.id} className="hero-card">
              <img 
                src={`http://localhost:3000${hero.image}`} 
                alt={hero.name}
                onError={(e) => {
                  e.target.onerror = null;
                }}
              />
              <h3>{hero.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Heroes;

// src/components/Heroes.jsx
import React, { useState, useEffect } from 'react';
import { getHeroes } from "../API/Index";
import './Heroes.css';

const StarRating = ({ rating, onRatingChange }) => {
  const [hover, setHover] = useState(null);

  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={index}
            className={`star ${starValue <= (hover || rating) ? 'filled' : 'empty'}`}
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(null)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const Heroes = ({ user, token }) => {
  const [heroes, setHeroes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);

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

  const handleReviewSubmit = async (heroId) => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    try {
      // Add your API call here to submit the review
      // Example: await submitReview(heroId, review, rating, token);
      
      setReview('');
      setRating(0);
      setSelectedHero(null);
      // Optionally refresh heroes data after submission
    } catch (error) {
      setError('Failed to submit review');
      console.error('Error submitting review:', error);
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
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
              <button 
                className="review-button"
                onClick={() => setSelectedHero(hero)}
              >
                Write a Review
              </button>

              {selectedHero && selectedHero.id === hero.id && (
                <div className="review-form">
                  <div className="rating-container">
                    <label>Your Rating:</label>
                    <StarRating 
                      rating={rating} 
                      onRatingChange={setRating} 
                    />
                  </div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review here..."
                    rows="4"
                  />
                  <div className="review-buttons">
                    <button 
                      onClick={() => handleReviewSubmit(hero.id)}
                      disabled={!review.trim() || !rating}
                      className="submit-button"
                    >
                      Submit Review
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedHero(null);
                        setReview('');
                        setRating(0);
                      }}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Heroes;

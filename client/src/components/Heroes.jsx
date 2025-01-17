// src/components/Heroes.jsx
import React, { useState, useEffect } from 'react';
import { getHeroes } from "../API/Index";
import './Heroes.css';

const StarRating = ({ rating, onRatingChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : 'empty'}`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const Request = () => {
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

  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: '',
    selectedHero: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleRatingChange = (newRating) => {
    setReviewData(prevState => ({
      ...prevState,
      rating: newRating
    }));
  };

  const handleHeroSelect = (heroName) => {
    setReviewData(prevState => ({
      ...prevState,
      selectedHero: heroName
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Review submitted:', reviewData);
    // Reset form after submission
    setReviewData({
      rating: 0,
      review: '',
      selectedHero: ''
    });
  };

  return (
    <div className="reviews-container">
      <h1>Rate a Hero</h1>
      
      {!reviewData.selectedHero ? (
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
        // Review Form
        <div className="review-form-section">
          <div className="selected-hero-banner">
            <img 
              src={`http://localhost:3000${heroes.find(h => h.name === reviewData.selectedHero)?.image}`}
              alt={reviewData.selectedHero}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/fallback-hero.png';
              }}
            />
            <h2>Review {reviewData.selectedHero}</h2>
            <button 
              className="change-hero-btn2"
              onClick={() => setReviewData(prev => ({ ...prev, selectedHero: '' }))}
            >
              Change Hero
            </button>
          </div>
  
          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-group">
              <label>Rate this hero</label>
              <StarRating
                rating={reviewData.rating}
                onRatingChange={handleRatingChange}
              />
            </div>
  
            <div className="form-group">
              <label htmlFor="review">Write your review</label>
              <textarea
                id="review"
                name="review"
                value={reviewData.review}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Share your experience with this hero..."
                rows="4"
              />
            </div>
  
            <button 
              type="submit" 
              className="submit-button"
              disabled={!reviewData.rating || !reviewData.review.trim()}
            >
              Submit Review
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Request;

import React, { useState, useEffect } from 'react';
import { getHeroes, getHeroReviews, getReviewsByHeroId, submitHeroReview } from "../API/Index";
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Heroes.css';

const API_URL = 'http://localhost:3000';

// StarRating Component
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className={`star-rating ${readOnly ? 'disabled' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : 'empty'}`}
          onClick={() => !readOnly && onRatingChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

// AverageRating Component
const AverageRating = ({ rating }) => {
  const displayRating = isNaN(rating) ? 'No ratings yet' : rating;
  
  return (
    <div className="average-rating">
      {!isNaN(rating) && (
        <span className="average-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? 'filled' : 'empty'}`}
            >
              ★
            </span>
          ))}
        </span>
      )}
      <span className="rating-number">({displayRating})</span>
    </div>
  );
};

const Heroes = () => {
  const { isLoggedIn, user } = useAuth();
  const [heroes, setHeroes] = useState([]);
  const [heroReviews, setHeroReviews] = useState({});
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: '',
    selectedHero: ''
  });

  const selectedHero = heroes.find(hero => hero.name === reviewData.selectedHero);

  // Load heroes and reviews
  useEffect(() => {
    const loadHeroesAndReviews = async () => {
      try {
        const heroesData = await getHeroes();
        setHeroes(heroesData);

        const reviewsPromises = heroesData.map(hero => 
          getReviewsByHeroId(hero.id)
            .then(reviews => ({ heroId: hero.id, reviews }))
        );

        const allReviews = await Promise.all(reviewsPromises);
        const reviewsByHero = allReviews.reduce((acc, { heroId, reviews }) => {
          acc[heroId] = reviews;
          return acc;
        }, {});

        setHeroReviews(reviewsByHero);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      }
    };

    loadHeroesAndReviews();
  }, []);

  const handleHeroSelect = (heroName) => {
    const selectedHero = heroes.find(h => h.name === heroName);
    setReviewData(prev => ({
      ...prev,
      selectedHero: heroName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedHero = heroes.find(h => h.name === reviewData.selectedHero);
      
      const newReview = {
        heroId: selectedHero.id,
        userId: user.id,
        rating: parseInt(reviewData.rating),
        review: reviewData.review.trim()
      };

      const response = await submitHeroReview(newReview);
      await refreshHeroReviews(selectedHero.id);
      
      setReviewData({ rating: 0, review: '', selectedHero: '' });
      setError('Review submitted successfully!');
      setTimeout(() => setError(null), 3000);

    } catch (error) {
      console.error('Review submission error:', error);
      setError(error.message || 'Failed to submit review');
    }
  };

  const refreshHeroReviews = async (heroId) => {
    try {
      const reviews = await getReviewsByHeroId(heroId);
      setHeroReviews(prev => ({
        ...prev,
        [heroId]: reviews
      }));
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  const calculateAverageRating = (reviews) => {
    // Check if reviews exists and has the expected structure
    if (!reviews || !Array.isArray(reviews)) return 'N/A';
    if (reviews.length === 0) return 'N/A';
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  

  return (
    <div className="heroes-container">
      <h1>Heroes</h1>
      
      <div className="heroes-grid">
        {heroes.map(hero => (
          <div key={hero.id} className="hero-card">
            <img 
  src={`${API_URL}/${hero.image}`} 
  alt={hero.name}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/default-hero.png'; 
  }}
  className="hero-image"
/>
            <h3>{hero.name}</h3>
            <AverageRating rating={calculateAverageRating(heroReviews[hero.id])} />
            
            <div className="reviews-section">
              <h4>Reviews ({heroReviews[hero.id]?.reviews?.length || 0})</h4>
              {heroReviews[hero.id]?.reviews?.map((review, index) => (
                <div key={review.id || index} className="review-item">
                  <StarRating rating={review.rating} readOnly />
                  <p>{review.review}</p>
                  <small>{new Date(review.timestamp).toLocaleDateString()}</small>
                </div>
              ))}
            </div>

            <div className="review-action">
              {isLoggedIn ? (
                <button 
                  className="review-button"
                  onClick={() => handleHeroSelect(hero.name)}
                >
                  Write a Review
                </button>
              ) : (
                <div className="login-prompt">
                  <button className="review-button disabled" disabled>
                    Write a Review
                  </button>
                  <span className="login-tooltip">
                    Log in to write a review
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Updated Review Modal */}
      {reviewData.selectedHero && isLoggedIn && (
        <div className="review-modal">
          <div className="review-form-container">
            <div 
              className="review-hero-image" 
              style={{ 
                backgroundImage: `url(${API_URL}/${selectedHero?.image})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
              }}
            />
      <div className="review-form-content">
              <h2>Review {reviewData.selectedHero}</h2>
              <form onSubmit={handleSubmit} className="review-form">
                <div className="form-group">
                  <label>Rating</label>
                  <StarRating
                    rating={reviewData.rating}
                    onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                  />
                </div>
                <div className="form-group">
                  <label>Review</label>
                  <textarea
                    value={reviewData.review}
                    onChange={(e) => setReviewData(prev => ({ ...prev, review: e.target.value }))}
                    required
                    placeholder="Write your review here..."
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    Submit Review
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setReviewData(prev => ({ ...prev, selectedHero: '' }))}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

{error && (
        <div className={`message ${error.includes('success') ? 'success' : 'error'}`}>
          {error}
          <button onClick={() => setError(null)} className="close-message">×</button>
        </div>
      )}
    </div>
  );
};

export default Heroes;

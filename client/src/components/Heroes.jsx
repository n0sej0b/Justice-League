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

  const [expandedReviews, setExpandedReviews] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);


  
  const toggleReview = (heroId, index) => {
    console.log('Toggling review:', heroId, index);
    setExpandedReviews(prev => ({
      ...prev,
      [`${heroId}-${index}`]: !prev[`${heroId}-${index}`]
    }));
  };

  const selectedHero = heroes.find(hero => hero.name === reviewData.selectedHero);

  // Load heroes and reviews
  useEffect(() => {
    const loadHeroesAndReviews = async () => {
      try {
        const heroesData = await getHeroes();
        setHeroes(heroesData);
  
        const reviewsPromises = heroesData.map(hero => 
          getReviewsByHeroId(hero.id)
            .then(reviewsData => {
              console.log(`Reviews for hero ${hero.id}:`, reviewsData); // Debug log
              return {
                heroId: hero.id,
                reviews: Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []
              };
            })
        );
  
        const allReviews = await Promise.all(reviewsPromises);
        const reviewsByHero = allReviews.reduce((acc, { heroId, reviews }) => {
          acc[heroId] = reviews;
          return acc;
        }, {});
  
        console.log('Final reviews state:', reviewsByHero); // Debug log
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
      const reviewsArray = reviews.reviews || Object.values(reviews) || [];
      setHeroReviews(prev => ({
        ...prev,
        [heroId]: reviewsArray
      }));
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  useEffect(() => {
    if (selectedReview) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedReview]);
  
  
  
  

  const calculateAverageRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 'N/A';
    
    const sum = reviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
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
  <h4>Reviews ({Array.isArray(heroReviews[hero.id]) ? heroReviews[hero.id].length : 0})</h4>
  
  {Array.isArray(heroReviews[hero.id]) && heroReviews[hero.id].map((review, index) => {
  if (!review) return null;

  const reviewText = review.review;
  if (!reviewText) return null;

  const shortReview = reviewText.slice(0, 100);
  const needsExpansion = reviewText.length > 100;

  return (
    <div 
      key={review.id || index} 
      className="review-item"
      onClick={() => setSelectedReview(review)}
      style={{ cursor: 'pointer' }}
    >
      <StarRating rating={Number(review.rating) || 0} readOnly />
      <p className="review-text">
        {needsExpansion ? `${shortReview}...` : reviewText}
      </p>
      <small>
        {review.timestamp ? new Date(review.timestamp).toLocaleDateString() : 'No date'}
      </small>
    </div>
  );
})}

{/* Review Modal */}
{selectedReview && (
  <div className="review-modal-overlay" onClick={() => setSelectedReview(null)}>
    <div className="review-modal-content" onClick={e => e.stopPropagation()}>
      <button 
        className="close-modal-button"
        onClick={() => setSelectedReview(null)}
      >
        ×
      </button>
      <div className="modal-review-content">
        <StarRating rating={Number(selectedReview.rating) || 0} readOnly />
        <p className="review-text">{selectedReview.review}</p>
        <small>
          {selectedReview.timestamp 
            ? new Date(selectedReview.timestamp).toLocaleDateString() 
            : 'No date'
          }
        </small>
      </div>
    </div>
  </div>
)}



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

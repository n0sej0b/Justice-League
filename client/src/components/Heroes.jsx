import React, { useState, useEffect } from 'react';
import { getHeroes, getReviewsByHeroId, submitHeroReview } from "../API/Index";
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Heroes.css';

const API_URL = 'http://localhost:3000';

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  const handleMouseEnter = (star) => !readOnly && setHover(star);
  const handleMouseLeave = () => !readOnly && setHover(0);
  const handleClick = (star) => !readOnly && onRatingChange(star);

  return (
    <div className={`star-rating1 ${readOnly ? 'disabled' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : 'empty'}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const AverageRating = ({ rating }) => {
  const displayRating = isNaN(rating) ? 'No ratings yet' : rating;
  
  return (
    <div className="average-rating1">
      {!isNaN(rating) && (
        <span className="average-stars1">
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
      <span className="rating-number1">({displayRating})</span>
    </div>
  );
};

const Heroes = () => {
  const { isLoggedIn, user } = useAuth();
  const [heroes, setHeroes] = useState([]);
  const [heroReviews, setHeroReviews] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: '',
    selectedHero: ''
  });
  const [expandedReviews, setExpandedReviews] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);

  const hasUserReviewedHero = (heroId) => {
    if (!heroReviews[heroId] || !Array.isArray(heroReviews[heroId]) || !user) {
      return false;
    }
    return heroReviews[heroId].some(review => String(review.userId) === String(user.id));
  };

  const calculateAverageRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 'N/A';
    const sum = reviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const loadHeroesAndReviews = async () => {
    try {
      const heroesData = await getHeroes();
      setHeroes(heroesData);

      const reviewsPromises = heroesData.map(hero => 
        getReviewsByHeroId(hero.id)
          .then(reviewsData => ({
            heroId: hero.id,
            reviews: reviewsData.reviews || reviewsData || []
          }))
      );

      const allReviews = await Promise.all(reviewsPromises);
      const reviewsByHero = allReviews.reduce((acc, { heroId, reviews }) => {
        acc[heroId] = Array.isArray(reviews) ? reviews : [];
        return acc;
      }, {});

      setHeroReviews(reviewsByHero);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    loadHeroesAndReviews();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', !!selectedReview);
    return () => document.body.classList.remove('modal-open');
  }, [selectedReview]);

  const handleHeroSelect = (heroName) => {
    const selectedHero = heroes.find(h => h.name === heroName);
    
    if (hasUserReviewedHero(selectedHero.id)) {
      setError('You have already reviewed this hero!');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setReviewData(prev => ({
      ...prev,
      selectedHero: heroName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedHero = heroes.find(h => h.name === reviewData.selectedHero);
      
      if (hasUserReviewedHero(selectedHero?.id)) {
        setError('You have already reviewed this hero!');
        setTimeout(() => setError(null), 3000);
        setReviewData({ rating: 0, review: '', selectedHero: '' });
        return;
      }

      const newReview = {
        heroId: selectedHero.id,
        userId: user.id,
        rating: parseInt(reviewData.rating),
        review: reviewData.review.trim(),
        created_at: new Date().toISOString()
      };

      await submitHeroReview(newReview);

      setHeroReviews(prev => ({
        ...prev,
        [selectedHero.id]: [...(prev[selectedHero.id] || []), newReview]
      }));

      await loadHeroesAndReviews();
      
      setReviewData({ rating: 0, review: '', selectedHero: '' });
      setError('Review submitted successfully!');
      setTimeout(() => setError(null), 3000);

    } catch (error) {
      console.error('Review submission error:', error);
      setError(error.message || 'Failed to submit review');
    }
  };

  const renderReviewModal = () => {
    const selectedHero = heroes.find(hero => hero.name === reviewData.selectedHero);
    if (!reviewData.selectedHero || !isLoggedIn) return null;

    return (
      <div className="review-modal1">
        <div className="review-form-container1">
          <div 
            className="review-hero-image1" 
            style={{ 
              backgroundImage: `url(${API_URL}/${selectedHero?.image})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="review-form-content1">
            <h2>Review {reviewData.selectedHero}</h2>
            <form onSubmit={handleSubmit} className="review-form1">
              <div className="form-group1">
                <label>Rating</label>
                <StarRating
                  rating={reviewData.rating}
                  onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                />
              </div>
              <div className="form-group1">
                <label>Review</label>
                <textarea
                  value={reviewData.review}
                  onChange={(e) => setReviewData(prev => ({
                    ...prev,
                    review: e.target.value
                  }))}
                  required
                  placeholder="Write your review here..."
                />
              </div>
              <div className="form-actions1">
                <button 
                  type="submit" 
                  className={hasUserReviewedHero(selectedHero?.id) ? "submit-button1-disabled" : "submit-button1"}
                  disabled={hasUserReviewedHero(selectedHero?.id)}
                >
                  {hasUserReviewedHero(selectedHero?.id) ? "Already Reviewed" : "Submit Review"}
                </button>
                <button 
                  type="button" 
                  className="cancel-button1"
                  onClick={() => {
                    setReviewData({ rating: 0, review: '', selectedHero: '' });
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderHeroCard = (hero) => {
    const heroReviewsList = heroReviews[hero.id] || [];
    
    return (
      <div key={hero.id} className="hero-card1">
        <img 
          src={`${API_URL}/${hero.image}`} 
          alt={hero.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-hero.png';
          }}
          className="hero-image1"
        />
        <h3>{hero.name}</h3>
        <AverageRating rating={calculateAverageRating(heroReviewsList)} />
        
        <div className="reviews-section1">
          <h4>Reviews ({heroReviewsList.length})</h4>
          {heroReviewsList.map((review, index) => (
            <div 
              key={review.id || index} 
              className="review-item1"
              onClick={() => setSelectedReview(review)}
              style={{ cursor: 'pointer' }}
            >
              <StarRating rating={Number(review.rating)} readOnly />
              <p className="review-text">
                {review.review && review.review.length > 100 
                  ? `${review.review.slice(0, 100)}...` 
                  : review.review}
              </p>
              <small>
                {new Date(review.created_at || Date.now()).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </div>
          ))}
        </div>

        <div className="review-action1">
          {isLoggedIn ? (
            hasUserReviewedHero(hero.id) ? (
              <button 
                className="review-buttondisabled" 
                disabled
              >
                Already Reviewed
              </button>
            ) : (
              <button 
                className="review-button1"
                onClick={() => handleHeroSelect(hero.name)}
              >
                Write a Review
              </button>
            )
          ) : (
            <div className="login-prompt1" title="Please log in to write a review">
              <Link to="/login" className="review-button1">
                Write a Review
              </Link>
              <div className="login-tooltip1">
                Please log in to write a review
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="heroes-container1">
      <h1>Heroes</h1>
      <div className="search-container1">
        <input
          type="text"
          className="search-input1"
          placeholder="Search heroes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="heroes-grid1">
        {heroes
          .filter(hero => hero.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(renderHeroCard)}
      </div>

      {renderReviewModal()}

      {error && (
        <div className={`message ${error.includes('success') ? 'success' : 'error'}`}>
          {error}
          <button onClick={() => setError(null)} className="close-message">×</button>
        </div>
      )}

      {selectedReview && (
        <div className="review-modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="review-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedReview(null)}>×</button>
            <div className="modal-review-content">
              <div className="modal-review-header">
                <StarRating rating={Number(selectedReview.rating)} readOnly />
                <p className="review-date">
                  {selectedReview.created_at ? (
                    new Date(selectedReview.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : (
                    'No date available'
                  )}
                </p>
              </div>
              <div className="modal-review-body">
                <p>{selectedReview.review}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heroes;

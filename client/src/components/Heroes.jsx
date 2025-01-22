// src/components/Heroes.jsx
import { useState, useEffect } from 'react';
import { getHeroes, getHeroReviews, getReviewsByHeroId, submitHeroReview } from "../API/Index";
import './Heroes.css';
const API_URL = 'http://localhost:3000'

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className={`star-rating ${readOnly ? 'disabled' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : 'empty'}`}
          onClick={!readOnly ? () => onRatingChange(star) : undefined}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ cursor: readOnly ? 'not-allowed' : 'pointer' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};



const AverageRating = ({ rating }) => {
  return (
    <div className="average-rating">
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
      <span className="rating-number">({rating})</span>
    </div>
  );
};

const Request = ({ isLoggedIn, user }) => {
  const [heroes, setHeroes] = useState([]);
  const [heroReviews, setHeroReviews] = useState({});
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: '',
    selectedHero: ''
  });

  useEffect(() => {
    const loadHeroesAndReviews = async () => {
      try {
        
        const heroesData = await getHeroes();
        console.log(heroesData);
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

 
  const refreshHeroReviews = async (heroId) => {
    try {
      const updatedReviews = await getHeroReviews(heroId);
      setHeroReviews(prev => ({
        ...prev,
        [heroId]: updatedReviews
      }));
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  const HeroReviews = ({ reviews }) => {
    if (!reviews || reviews.length === 0) {
      return <p>No reviews yet</p>;
    }
  
    return (
      <div className="hero-reviews">
        {reviews.reviews.map((review, index) => (
          <div key={review.id || `review-${index}`} className="review-item">
            <StarRating rating={review.rating} readOnly />
            <p className="review-text">{review.review}</p>
            <small className="review-date">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }).format(new Date(review.timestamp))}
            </small>
          </div>
        ))}
      </div>
    );
    
    
  };
  


  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 'N/A';
    console.log(reviews)
    const sum = reviews.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
    
  };
  

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
    if (!isLoggedIn) {
      setError('Please log in to write a review');
      return;
    }
    setReviewData(prevState => ({
      ...prevState,
      selectedHero: heroName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Please log in to submit a review');
      return;
    }

    try {
      const selectedHero = heroes.find(h => h.name === reviewData.selectedHero);
      if (!selectedHero) {
        throw new Error('Please select a hero before submitting a review');
      }

      const newReview = {
        heroId: selectedHero.id,
        rating: reviewData.rating,
        review: reviewData.review.trim(),
        timestamp: new Date().toISOString(),
        userId: user.id // Add user ID from login state
      };

      await submitHeroReview(newReview);

      // Refresh reviews after submission
      await refreshHeroReviews(selectedHero.id);

      setReviewData({
        rating: 0,
        review: '',
        selectedHero: ''
      });
    } catch (error) {
      setError(error.message || 'Failed to submit review');
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="reviews-container">
      <h1>Heroes</h1>
      
      <div className="heroes-grid">
        {heroes.map(hero => (
          <div key={hero.id} className="hero-card">
            <img 
              src={`${API_URL}/${hero.image}`} 
              alt={hero.name}
              onError={(e) => {
                e.target.onerror = null;
              }}
            />
            <h3>{hero.name}</h3>
            <AverageRating 
              rating={calculateAverageRating(heroReviews[hero.id])} 
            />
            <div className="review-count">
              {heroReviews[hero.id]?.length || 0} reviews
            </div>
            <HeroReviews reviews={heroReviews[hero.id]} />
            
            {/* Review Button - Only show if logged in */}
            {isLoggedIn ? (
              <button 
                className="review-button"
                onClick={() => handleHeroSelect(hero.name)}
              >
                Write a Review
              </button>
            ) : (
              <div className="login-prompt">
                <p>Please log in to write a review</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal/Form - Only show if hero is selected and user is logged in */}
      {reviewData.selectedHero && isLoggedIn && (
        <div className="review-modal">
          <div className="review-form-section">
            <div className="selected-hero-banner">
              <img 
                src={`${API_URL}/${heroes.find(h => h.name === reviewData.selectedHero)?.image}`}
                alt={reviewData.selectedHero}
              />
              <h2>Review {reviewData.selectedHero}</h2>
              <button 
                className="close-button"
                onClick={() => setReviewData(prev => ({ ...prev, selectedHero: '' }))}
              >
                ×
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

              <div className="submit-button-container">
                <button 
                  type="submit" 
                  className={`submit-button ${!reviewData.rating || !reviewData.review.trim() ? 'disabled' : ''}`}
                  disabled={!reviewData.rating || !reviewData.review.trim()}
                  data-tooltip={!reviewData.rating || !reviewData.review.trim() ? "Please fill in both rating and review" : ""}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default Request;

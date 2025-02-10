// StarRating.jsx
import React from 'react';
import './StarRating.css';

const StarRating = ({ rating, onRatingChange, readOnly }) => {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (selectedRating) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <div className="star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''} ${readOnly ? 'readonly' : ''}`}
          onClick={() => handleClick(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;

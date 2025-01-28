// Profile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../API/Index';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
      const fetchProfileData = async () => {
          try {
              setLoading(true);
              setError(null);
              
              // If no userId is provided, try to get the current user's profile
              const currentUser = JSON.parse(localStorage.getItem('user'));
              
              if (!userId && !currentUser) {
                  navigate('/login');
                  return;
              }

              const profileId = userId || currentUser.id;
              console.log('Fetching profile for user:', profileId);
              
              const userData = await getUserProfile(profileId);
              console.log('Received user data:', userData);
              
              if (!userData) {
                  throw new Error('No user data received');
              }
              
              setProfile(userData);
          } catch (err) {
              console.error('Profile fetch error:', err);
              setError(err.message || 'Failed to load profile');
          } finally {
              setLoading(false);
          }
      };

      fetchProfileData();
  }, [userId, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile: {error}</div>;
  if (!profile) return <div>No profile data available</div>;

  return (
      <div className="profile-container">
          <div className="profile-header">
              <h1>{profile.username}'s Profile</h1>
              <p>Email: {profile.email}</p>
          </div>

          <div className="reviews-section">
              <h2>Reviews</h2>
              {profile.Reviews && profile.Reviews.length > 0 ? (
                  <div className="reviews-grid">
                      {profile.Reviews.map(review => (
                          <div key={review.id} className="review-card">
                              <h3>Hero Review</h3>
                              <div className="rating">Rating: {review.rating}/5</div>
                              <p>{review.reviewText}</p>
                              <small>Posted on: {new Date(review.createdAt).toLocaleDateString()}</small>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p>No reviews yet</p>
              )}
          </div>
      </div>
  );
}

export default Profile;

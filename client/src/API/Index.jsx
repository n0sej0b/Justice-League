const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// const API_URL = 'http://localhost:3000';

// Helper function to get token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  export const getHeroes = async () => {
    try {
      // Remove /api from the URL if your backend doesn't use it
      const response = await fetch(`${API_URL}/heroes`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
      });
  
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`Failed to fetch heroes: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Heroes data:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching heroes:', error);
      throw error;
    }
  };

  export const getReviewsByHeroId = async (heroId) => {
    try {
      const response = await fetch(`${API_URL}/heroes/${heroId}/reviews`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  };

  export const submitHeroReview = async (reviewData) => {
    try {
      // Match the exact field names expected by the server
      const formattedReview = {
        heroId: reviewData.heroId,
        userId: reviewData.userId,
        rating: parseInt(reviewData.rating),
        reviewText: reviewData.review  // Changed from 'review' to 'reviewText'
      };
  
      console.log('Sending review data:', formattedReview);
  
      const response = await fetch('http://localhost:3000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formattedReview)
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit review');
      }
  
      return responseData;
    } catch (error) {
      console.error('Review submission failed:', error);
      throw error;
    }
  };
  
  
  
  
  

  export const getHeroReviews = async (heroId) => {
    try {
      const response = await fetch(`${API_URL}/heroes/${heroId}/reviews`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch hero reviews: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching hero reviews:', error);
      throw error;
    }
  };

export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const createReview = async (reviewData) => {
  try {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete review: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, updates) => {
  try {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

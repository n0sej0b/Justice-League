const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get authentication header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Common headers for API requests
const commonHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Generic fetch handler with error management
const handleFetch = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
};

export const getHeroes = async () => {
  return handleFetch(`${API_URL}/heroes`, {
    method: 'GET',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    }
  });
};

export const getReviewsByHeroId = async (heroId) => {
  try {
    const data = await handleFetch(`${API_URL}/heroes/${heroId}/reviews`, {
      method: 'GET',
      headers: {
        ...commonHeaders,
        ...getAuthHeader()
      }
    });

    const reviews = data.reviews || [];
    
    return reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      review: review.review_text,
      timestamp: review.created_at
    }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const submitHeroReview = async (reviewData) => {
  const formattedReview = {
    heroId: reviewData.heroId,
    userId: reviewData.userId,
    rating: parseInt(reviewData.rating),
    reviewText: reviewData.review
  };

  return handleFetch(`${API_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    },
    body: JSON.stringify(formattedReview)
  });
};

export const login = async (credentials) => {
  try {
    const data = await handleFetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(credentials)
    });

    if (!data || !data.token) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getHeroReviews = async (heroId) => {
  return handleFetch(`${API_URL}/api/heroes/${heroId}/reviews`, {
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    }
  });
};

export const fetchUsers = async () => {
  return handleFetch(`${API_URL}/api/users`, {
    method: 'GET',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    }
  });
};

export const createUser = async (userData) => {
  return handleFetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(userData)
  });
};

export const createReview = async (reviewData) => {
  return handleFetch(`${API_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    },
    body: JSON.stringify(reviewData)
  });
};

export const getUserRequests = async () => {
  return handleFetch(`${API_URL}/api/requests`, {
    method: 'GET',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    }
  });
};

export const createRequest = async (requestData) => {
  const formattedRequest = {
    title: requestData.title,
    description: requestData.description,
    location: requestData.location,
    urgency: requestData.urgency,
    contactInfo: requestData.contactInfo,
    hero_id: requestData.hero_id
  };

  return handleFetch(`${API_URL}/api/requests`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    },
    body: JSON.stringify(formattedRequest)
  });
};

export const updateRequest = async (requestId, updateData) => {
  return handleFetch(`${API_URL}/api/requests/${requestId}`, {
    method: 'PUT',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    },
    body: JSON.stringify(updateData)
  });
};

export const getHeroRequests = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  return handleFetch(`${API_URL}/api/requests/hero`, {
    method: 'GET',
    headers: {
      ...commonHeaders,
      'Authorization': `Bearer ${token}`
    }
  });
};

export const deleteReview = async (reviewId, token) => {
  if (!reviewId) {
    throw new Error('Review ID is required');
  }

  return handleFetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      ...commonHeaders,
      'Authorization': `Bearer ${token}`
    }
  });
};

export const deleteRequest = async (requestId) => {
  return handleFetch(`${API_URL}/api/requests/${requestId}`, {
    method: 'DELETE',
    headers: {
      ...commonHeaders,
      ...getAuthHeader()
    }
  });
};

export const updateReview = async (reviewId, updatedData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return handleFetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: 'PUT',
    headers: {
      ...commonHeaders,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rating: updatedData.rating,
      review_text: updatedData.review_text
    })
  });
};

export const getUserProfile = async (userId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  return handleFetch(`${API_URL}/api/users/${userId}`, {
    headers: {
      ...commonHeaders,
      'Authorization': `Bearer ${token}`
    }
  });
};

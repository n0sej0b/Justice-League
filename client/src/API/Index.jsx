const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import { useAuth } from '../components/AuthContext';

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
  
      const data = await response.json();
      console.log(`Raw reviews data for hero ${heroId}:`, data);
  
      // Extract the reviews array from the response
      const reviews = data.reviews || [];
      
      // Log a sample review if available
      if (reviews.length > 0) {
        console.log('Sample review before mapping:', reviews[0]);
      }
  
      // Map the reviews to ensure consistent structure
      const mappedReviews = reviews.map(review => {
        const mapped = {
          id: review.id,
          rating: review.rating,
          review: review.review_text,
          timestamp: review.created_at
        };
        console.log('Mapped review:', mapped);
        return mapped;
      });
  
      return mappedReviews;
  
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  };
  
  
  
  
  

  export const submitHeroReview = async (reviewData) => {
    try {
      const formattedReview = {
        heroId: reviewData.heroId,
        userId: reviewData.userId,
        rating: parseInt(reviewData.rating),
        reviewText: reviewData.review
      };
  
      console.log('Sending review data:', formattedReview);
  
      // Use API_URL instead of hardcoded URL
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',  // Add this to ensure JSON response
          ...getAuthHeader()  // Use the helper function for authentication
        },
        body: JSON.stringify(formattedReview)
      });
  
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to submit review: ${response.status}`);
      }
  
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Review submission failed:', error);
      throw error;
    }
  };
  
  
  
  
  
  export const login = async (credentials) => {
    try {
      console.log('Making login request with:', credentials);
  
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
  
      console.log('Login response status:', response.status);
  
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
      console.log('Login response data:', data);
  
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
    try {
      const response = await fetch(`${API_URL}/api/heroes/${heroId}/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
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

export const getUserRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/api/requests`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch requests');
    }

    const data = await response.json();
    console.log('Fetched user requests:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
};

// In your frontend Index.jsx file

export const createRequest = async (requestData) => {
  try {
    console.log('Sending request data:', requestData); // Debug log

    const response = await fetch(`${API_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        title: requestData.title,
        description: requestData.description,
        location: requestData.location,
        urgency: requestData.urgency,
        contactInfo: requestData.contactInfo,
        hero_id: requestData.hero_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create request');
    }

    const data = await response.json();
    console.log('Created request:', data);
    return data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};


// Update a request
export const updateRequest = async (requestId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/api/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

export const getHeroRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://localhost:3000/api/requests/hero', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch hero requests');
    }

    const data = await response.json();
    console.log('Hero requests data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching hero requests:', error);
    throw error;
  }
};



export const deleteReview = async (reviewId, token) => {
  if (!reviewId) {
    console.error('No review ID provided');
    throw new Error('Review ID is required');
  }

  try {
    console.log('Sending delete request for review:', reviewId);

    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, { // Update URL path
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Delete response status:', response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete review: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
};






export const deleteRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/api/requests/${requestId}`, { // Updated URL path
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};



export const updateReview = async (reviewId, updatedData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rating: updatedData.rating,
        review_text: updatedData.review_text
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to update review: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Review updated successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw error;
  }
};





export const getUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user profile');
    }

    const data = await response.json();
    console.log('Fetched profile data:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

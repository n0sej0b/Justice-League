const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = 'http://localhost:3000'

export async function getHeroes() {
    try {
        const response = await fetch(`/api/heroes`, {
            method: 'GET',
            credentials: 'include',  
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch(error) {
        console.error('Error fetching heroes:', error);
        throw error;
    }
}


export async function fetchUsers() {
    try {
        console.log('Calling API URL:', `/api/users`);

        const response = await fetch(`/api/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const text = await response.text();
            console.log('Error response body:', text);
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
        }
        
        const data = await response.json();
        return data;
    } catch(error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}



export const createReview = async (reviewData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reviews`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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


export async function deleteReview(userToken, reviewId) {
    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete review: ${response.status}`);
        }
        return response.ok;
    } catch(error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}


export async function createUser(userData) {
    try {
        const response = await fetch('/api/users', {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                password: userData.password
            })
        });

        // Add debugging
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}




export const getHeroReviews = async () => {
    try {
        const response = await fetch(`/api/reviews`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        return await response.json();
    } catch(error) {
        console.error('Error fetching hero reviews:', error);
        throw error;
    }
};


export const submitHeroReview = async (reviewData) => {
    if (!reviewData.heroId || !reviewData.rating || !reviewData.reviewText) {
        throw new Error('Missing required review data');
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`/api/reviews`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                heroId: reviewData.heroId,
                rating: parseInt(reviewData.rating),
                reviewText: reviewData.reviewText.trim()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit review');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
};


export async function getReviewsByHeroId(heroId) {
    if (!heroId) {
        throw new Error('Hero ID is required');
    }

    try {
        const response = await fetch(`/api/heroes/${heroId}/reviews`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch hero reviews');
        }

        return await response.json();
    } catch(error) {
        console.error(`Error fetching reviews for hero ${heroId}:`, error);
        throw error;
    }
}


export async function updateReview(userToken, reviewId, updates) {
    if (!reviewId || !updates) {
        throw new Error('Review ID and updates are required');
    }

    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update review');
        }

        return await response.json();
    } catch(error) {
        console.error('Error updating review:', error);
        throw error;
    }
}

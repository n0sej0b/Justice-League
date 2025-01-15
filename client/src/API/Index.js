const API_URL = 'http://localhost:3000'

export async function getHeroes() {
    try{
  const response = await fetch(`${API_URL}/api/heroes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify()
      });
      const data = await response.json();
      return data;
  } catch(error){
    console.error('Error fetching heroes:', error);
    throw error;
    }
  }
 
  export async function getReviews( ) {
    try{
    const response = await fetch (`${API_URL}/api/reviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify()
    });
    const data = await response.json();
    return data;
  } catch(error){
    console.error('Error fetching reviews:', error);
    throw error;
}
  }

  export async function fetchUsers() {
    try{
    const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify()
    });
    const data = await response.json();
    return data;
  } catch(error){
    console.error('Error fetching users:', error);
    throw error;
}
  }
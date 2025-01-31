const { client, createTables, createUser, fetchUsers, fetchUserById, fetchHeroById, fetchHeroes, insertInitialHeroes, authenticateUser, createReview, getHeroReviews, deleteReview } = require('./db');

const express = require('express');
const app = express(); 
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const { JWT_SECRET } = process.env; 
const bcrypt = require('bcrypt');
const router = express.Router();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

const path = require('path');
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets/images', express.static(path.join(__dirname, './assets/images'))); 

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'secrettoken');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Review routes
app.post('/reviews', async (req, res) => {
  try {
    const { heroId, userId, rating, reviewText } = req.body;

    if (!heroId || !userId || !rating || !reviewText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newReview = await createReview({
      heroId,
      userId,
      rating,
      reviewText
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/api/users/:userId', async (req, res) => {
  console.log('Attempting to fetch user with ID:', req.params.userId);
  try {
    const user = await fetchUserById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/heroes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hero = await fetchHeroById(id);
    
    if (!hero) {
      return res.status(404).json({ message: 'Hero not found' });
    }
    
    res.json(hero);
  } catch (error) {
    console.error('Error fetching hero:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/heroes/:heroId/reviews', async (req, res) => {
  try {
    const { heroId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const reviewData = await getHeroReviews(heroId, limit, offset);
    
    if (!reviewData) {
      return res.status(404).json({ message: 'No reviews found' });
    }

    res.json(reviewData);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id; // From authenticateToken middleware

    console.log('Attempting to delete review:', { reviewId, userId });

    if (checkReview.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (checkReview.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Delete the review
    await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Server error deleting review:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
});

app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From your auth middleware

    const result = await deleteRequest(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete request' 
    });
  }
});



// In index.js
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    console.log('Attempting to delete review:', { reviewId, userId });

    // Validate reviewId
    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }

    const result = await deleteReview(reviewId, userId);
    
    if (result) {
      res.json({ message: 'Review deleted successfully' });
    } else {
      res.status(404).json({ message: 'Review not found or unauthorized' });
    }
  } catch (error) {
    console.error('Server error deleting review:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
});



router.get('/api/users', async (req, res) => {
  try {
    const users = await fetchUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// In your server's index.js or auth routes file
app.post('/api/login', async (req, res) => {
  try {
    // Log the incoming request
    console.log('Login request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      console.log('Missing credentials:', { username: !!username, password: !!password });
      return res.status(400).json({ 
        message: 'Username and password are required'
      });
    }

    // Attempt authentication
    const user = await authenticateUser({ username, password });

    // Log successful authentication
    console.log('User authenticated successfully:', { username: user.username });

    // Send response
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: user.token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const user = await createUser({ 
      username, 
      email, 
      password 
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create user' 
    });
  }
});

app.post('/api/auth', async (req, res, next) => {
  try {
    const user = await authenticateUser(req.body);
    res.send(user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/heroes', async (req, res) => {
  try {
    const heroes = await fetchHeroes();
    res.json(heroes);
  } catch (error) {
    console.error('Error fetching heroes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.use('/', router);


const seed = async () => {
      await createTables();
    console.log('tables created');
    await Promise.all([
        createUser({ username: 'superman', password: 'krypto1234', email: 'clarkkent@wayne.com' }),
        createUser({ username: 'joker', password: 'harley1234', email: 'harley@wayne.com' }),
        createUser({ username: 'vixen', password: 'claws1234', email: 'vixen@wayne.com' }),
        createUser({ username: 'nightwing', password: 'dick1234', email: 'dick@wayne.com' }),
        createUser({ username: 'lobo', password: 'power1234', email: 'lobo@wayne.com' }),
        createUser({ username: 'hawkgirl', password: 'hawktua1234', email: 'hawkgirl@wayne.com' }),
        createUser({ username: 'bane', password: 'venom1234', email: 'bane@wayne.com' }),
        createUser({ username: 'canary', password: 'decibel1234', email: 'canary@wayne.com' }),
        createUser({ username: 'aquaman', password: 'fishie1234', email: 'gayfish@wayne.com' }),
        createUser({ username: 'flash', password: 'reverse1234', email: 'flash@wayne.com' }),
        createUser({ username: 'greenlantern', password: 'yellow1234', email: 'greenlantern@wayne.com' }),
        createUser({ username: 'batman', password: 'mommyissues', email: 'bruce@wayne.com' }),
        createUser({ username: 'wonderwoman', password: 'island1234', email: 'diana@wayne.com' }),
        createUser({ username: 'darkseid', password: 'eyelazers1234', email: 'badguy@wayne.com' }),
        createUser({ username: 'solomongrundy', password: 'bornonmonday', email: 'coldhands@wayne.com' }),
    ]);
  
    
    await insertInitialHeroes();
  console.log('data seeded');
} 

const init = async () => {
  console.log('connecting to database');
  await client.connect();
  let seedflag = true;
  if (seedflag) {
    console.log('seeding')
    await seed();
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize the application
init().catch(err => {
  console.error('Failed to initialize application:', err);
  process.exit(1);
});
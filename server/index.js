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
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
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
    const { reviewId } = req.params;
    const userId = req.user.userId;

    await deleteReview(reviewId, userId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    if (error.message.includes('not found or unauthorized')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const user = await authenticateUser({ email, password });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message || 'An internal server error occurred'
    });
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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize the application
init().catch(err => {
  console.error('Failed to initialize application:', err);
  process.exit(1);
});
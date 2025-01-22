const { client, createTables, createUser, fetchUsers, fetchHeroes, insertInitialHeroes, authenticateUser, createReview, getHeroReviews, deleteReview } = require('./db');
const express = require('express');
const app = express(); 
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const { JWT_SECRET } = process.env; 
const bcrypt = require('bcrypt');


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
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { heroId, rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (!heroId || !rating || !reviewText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const review = await createReview({
      heroId,
      userId,
      rating,
      reviewText
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/heroes/:heroId/reviews', async (req, res) => {
  try {
    const { heroId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const reviews = await getHeroReviews(heroId, limit, offset);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
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

app.options('*', cors()); // Enable pre-flight for all routes

// User routes
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await fetchUsers();
    res.send(users);
  } catch (ex) {
    next(ex);
  }
});

// In your Index.jsx or auth route handler
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Use the authenticateUser function from your db.js
    const user = await authenticateUser({ email, password });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Send successful response
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







// Add this POST route for user creation
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Use the createUser function you already have imported from db.js
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


// Authentication route
app.post('/api/auth', async (req, res, next) => {
  try {
    const user = await authenticateUser(req.body);
    res.send(user);
  } catch (ex) {
    next(ex);
  }
});

// Heroes route
app.get('/api/heroes', async (req, res, next) => {
  try {
    const heroes = await fetchHeroes();
    res.send(heroes);
  } catch (ex) {
    next(ex);
  }
});

// // Database initialization
// const init = async () => {
//   console.log('connecting to database');
//   await client.connect();
//   let seed = true;
//   if (seed) {
//     console.log('seeding')
//     await seed();
//   }

//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`listening on port ${port}`));
// };

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
// Database initialization
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

const { client, createTables, createUser,ensureHeroStatus,getHeroRequests, updateReview, fetchUsers, fetchUserById, fetchHeroById, fetchHeroes, insertInitialHeroes, authenticateUser, createReview, getHeroReviews, deleteReview } = require('./db');

const express = require('express');
const app = express(); 
const cors = require('cors');
const jwt = require('jsonwebtoken');  
const bcrypt = require('bcrypt');
const router = express.Router();
const JWT_SECRET = 'secrettoken';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/assets/images', express.static(path.join(__dirname, './assets/images'))); 

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secrettoken', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.patch('/api/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate the status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the request status
    const result = await client.query(
      'UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});


// Review routes
app.post('/api/reviews', async (req, res) => {
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

const { checkUserStatus, updateHeroStatus } = require('./db');

app.get('/api/users/:username/status', async (req, res) => {
  try {
    const status = await checkUserStatus(req.params.username);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/users/:id/hero-status', async (req, res) => {
  try {
    const updated = await updateHeroStatus(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// In your server.js or routes file
app.get('/api/requests/hero', authenticateToken, async (req, res) => {
  try {
    console.log('Authenticated user:', req.user);
    
    if (!req.user.is_hero) {
      return res.status(403).json({ error: 'User is not a hero' });
    }

    const heroRequests = await getHeroRequests(req.user.username);
    console.log('Hero requests:', heroRequests);
    
    res.json(heroRequests);
  } catch (error) {
    console.error('Error fetching hero requests:', error);
    res.status(500).json({ error: 'Failed to fetch hero requests' });
  }
});




app.get('/api/heroes/:heroId/reviews', async (req, res) => {
  try {
    const { heroId } = req.params;
    console.log('Fetching reviews for hero:', heroId); // Debug log

    const reviews = await getReviewsByHeroId(heroId);
    console.log('Reviews found:', reviews); // Debug log

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching hero reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews',
      error: error.message 
    });
  }
});

// Update review endpoint
app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const { rating, review_text } = req.body;

    console.log('Attempting to update review:', { reviewId, userId, rating, review_text });

    // Input validation
    if (!rating || !review_text) {
      return res.status(400).json({ 
        message: 'Rating and review text are required' 
      });
    }

    const checkReview = async (reviewId, userId) => {
      const review = await pool.query(
        'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
        [reviewId, userId]
      );
      return review.rows[0];
    };

    // Update the review
    const updatedReview = await updateReview(reviewId, userId, {
      rating: parseInt(rating),
      review_text
    });

    if (!updatedReview) {
      return res.status(404).json({ 
        message: 'Failed to update review' 
      });
    }

    // Get the username for the response
    const userResult = await client.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    const reviewWithUser = {
      ...updatedReview,
      username: userResult.rows[0].username
    };

    console.log('Review updated successfully:', reviewWithUser);
    res.json(reviewWithUser);

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      message: 'Failed to update review', 
      error: error.message 
    });
  }
});



app.put('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, review_text } = req.body;

    if (!rating || !review_text) {
      return res.status(400).json({ message: 'Rating and review text are required' });
    }

    const updatedReview = await updateReview(reviewId, userId, { rating, review_text });

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    console.log('Delete review request received:', {
      reviewId,
      userId,
      params: req.params,
      user: req.user
    });

    // Check if review exists and belongs to user
    const reviewCheck = await client.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    console.log('Review check result:', reviewCheck.rows); // Debug log

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    // Delete the review
    const deleteResult = await client.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [reviewId, userId]
    );

    console.log('Delete result:', deleteResult.rows); // Debug log

    res.json({ 
      message: 'Review deleted successfully',
      deletedReview: deleteResult.rows[0]
    });

  } catch (error) {
    console.error('Server error deleting review:', error);
    res.status(500).json({ 
      message: 'Server error while deleting review',
      error: error.message 
    });
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



app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user from database
    const userResult = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    const user = userResult.rows[0];
    console.log('User query result:', user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create token using the defined JWT_SECRET
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        is_hero: user.is_hero 
      }, 
      JWT_SECRET,  // Use the constant we defined at the top
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_hero: user.is_hero,
      created_at: user.created_at
    };

    // Send response
    res.json({
      message: 'Login successful',
      token: token,
      user: safeUser
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
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

app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    // Log the authenticated user
    console.log('Authenticated user:', req.user);

    const result = await client.query(`
      SELECT 
        r.*,
        h.name as hero_name,
        h.image as hero_image
      FROM requests r
      LEFT JOIN heroes h ON r.hero_id = h.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    console.log('Fetched requests:', result.rows); // Debug log
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, urgency, contactInfo, hero_id } = req.body;
    const user_id = req.user.id;

    console.log('Creating request:', { 
      user_id, 
      hero_id, 
      title, 
      description, 
      location, 
      urgency, 
      contactInfo 
    });

    const result = await client.query(`
      INSERT INTO requests (
        user_id,
        hero_id,
        title,
        description,
        location,
        urgency,
        contact_info,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      user_id,
      hero_id,
      title,
      description,
      location,
      urgency,
      contactInfo,
      'pending'
    ]);

    console.log('Created request:', result.rows[0]); // Debug log
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_hero,
        u.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'rating', r.rating,
                'review_text', r.review_text,
                'created_at', r.created_at,
                'user_id', r.user_id
              )
            )
            FROM reviews r 
            WHERE r.user_id = u.id
          ),
          '[]'::json
        ) as "Reviews"
      FROM users u
      WHERE u.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User profile found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Update a request
app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const { title, description, location, urgency, contact_info, status } = req.body;

    const result = await client.query(
      `UPDATE requests 
       SET title = $1, description = $2, location = $3, 
           urgency = $4, contact_info = $5, status = $6, 
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, description, location, urgency, contact_info, status, requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a request
app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    const result = await client.query(
      'DELETE FROM requests WHERE id = $1 AND user_id = $2 RETURNING *',
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or unauthorized' });
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      'SELECT id, username, is_hero FROM users WHERE id = $1',
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.patch('/api/users/:id/make-hero', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await client.query(
      'UPDATE users SET is_hero = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});






app.get('/api/heroes/:heroId/requests', authenticateToken, async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        r.*,
        u.username,
        u.email
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.hero_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.heroId]);

    console.log('Hero requests:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hero requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});


const seed = async () => {
      await createTables();
    console.log('tables created');
    await Promise.all([
        createUser({ username: 'Superman', password: 'krypto1234', email: 'clarkkent@wayne.com' }),
        createUser({ username: 'Joker', password: 'harley1234', email: 'harley@wayne.com' }),
        createUser({ username: 'Vixen', password: 'claws1234', email: 'vixen@wayne.com' }),
        createUser({ username: 'Nightwing', password: 'dick1234', email: 'dick@wayne.com' }),
        createUser({ username: 'Lobo', password: 'power1234', email: 'lobo@wayne.com' }),
        createUser({ username: 'Hawkgirl', password: 'hawktua1234', email: 'hawkgirl@wayne.com' }),
        createUser({ username: 'Bane', password: 'venom1234', email: 'bane@wayne.com' }),
        createUser({ username: 'Canary', password: 'decibel1234', email: 'canary@wayne.com' }),
        createUser({ username: 'Aquaman', password: 'fishie1234', email: 'gayfish@wayne.com' }),
        createUser({ username: 'Flash', password: 'reverse1234', email: 'flash@wayne.com' }),
        createUser({ username: 'Greenlantern', password: 'yellow1234', email: 'greenlantern@wayne.com' }),
        createUser({ username: 'Batman', password: 'mommyissues', email: 'bruce@wayne.com' }),
        createUser({ username: 'Wonderwoman', password: 'island1234', email: 'diana@wayne.com' }),
        createUser({ username: 'Darkseid', password: 'eyelazers1234', email: 'badguy@wayne.com' }),
        createUser({ username: 'Solomongrundy', password: 'bornonmonday', email: 'coldhands@wayne.com' }),
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

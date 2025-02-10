const pg = require('pg');
const client = new pg.Client({
  user: 'postgres',
  password: '',
  host: 'localhost',
  port: 5432,
  database: 'justice_league_reviews_db',
});

const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';


const connect = async () => {
  if (!client._connected) {
    await client.connect();
  }
  return client;
};

const HERO_USERNAMES = [
  'Aquaman',
  'Batman',
  'Flash',
  'Greenlantern',
  'HawkGirl',
  'Superman',
  'WonderWoman',
  'NightWing',
  'Vixen',
  'Canary',
  'Darkseid',
  'Solomongrundy',
];

// In db.js
const deleteReview = async (reviewId, userId) => {
  try {
    const result = await client.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [reviewId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in deleteReview:', error);
    throw error;
  }
};

module.exports = {
  client,
  // ... other exports
  deleteReview,
};


const updateReview = async (reviewId, userId, { rating, review_text }) => {
  try {
    const result = await client.query(
      `UPDATE reviews 
       SET rating = $1, 
           review_text = $2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, rating, review_text, user_id, hero_id, created_at, updated_at`,
      [rating, review_text, reviewId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw error;
  }
};


// Function to delete a request
const deleteRequest = async (requestId, userId) => {
  const client = await connect();
  try {
    await client.query('BEGIN');

    // First verify the request exists and belongs to the user
    const requestCheck = await client.query(`
      SELECT id, user_id 
      FROM requests 
      WHERE id = $1
    `, [requestId]);

    if (requestCheck.rows.length === 0) {
      throw new Error('Request not found');
    }

    if (requestCheck.rows[0].user_id !== userId) {
      throw new Error('Unauthorized to delete this request');
    }

    // Delete any associated reviews or responses first
    await client.query(`
      DELETE FROM request_responses 
      WHERE request_id = $1
    `, [requestId]);

    // Delete the request
    const result = await client.query(`
      DELETE FROM requests 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [requestId, userId]);

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      throw new Error('Failed to delete request');
    }

    return { success: true, message: 'Request deleted successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deleteRequest:', error);
    throw error;
  }
};

const createRequest = async (requestData) => {
  try {
    const { 
      user_id, 
      hero_id, 
      title, 
      description, 
      location, 
      urgency, 
      contact_info 
    } = requestData;

    const result = await client.query(`
      INSERT INTO requests (
        id,
        user_id, 
        hero_id, 
        title, 
        description, 
        location, 
        urgency, 
        contact_info, 
        status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      uuid.v4(), // Generate UUID for the request
      user_id,
      hero_id,
      title,
      description,
      location,
      urgency,
      contact_info,
      'pending'
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error in createRequest:', error);
    throw error;
  }
};

const getUserRequests = async (userId) => {
  try {
    const result = await client.query(`
      SELECT 
        r.*,
        h.name as hero_name
      FROM requests r
      LEFT JOIN heroes h ON r.hero_id = h.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getUserRequests:', error);
    throw error;
  }
};

const getHeroRequests = async (heroName) => {
  try {
    console.log('Fetching requests for hero:', heroName);
    
    const result = await client.query(`
      SELECT 
        r.*,
        u.username as requester_name,
        h.name as hero_name,
        h.image as hero_image
      FROM requests r
      JOIN users u ON r.user_id = u.id
      JOIN heroes h ON r.hero_id = h.id
      WHERE h.name = $1
      ORDER BY r.created_at DESC
    `, [heroName]);
    
    console.log('Found hero requests:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error in getHeroRequests:', error);
    throw error;
  }
};




const createRequestsTable = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hero_id INTEGER REFERENCES heroes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        urgency VARCHAR(50) NOT NULL,
        contact_info TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT FALSE;
        UPDATE users SET is_hero = TRUE WHERE id = 'your_user_id';

      );
    `);
    console.log('Requests table created successfully');
  } catch (error) {
    console.error('Error creating requests table:', error);
    throw error;
  }
};
const checkUserStatus = async (username) => {
  try {
    const result = await client.query(
      'SELECT id, username, is_hero FROM users WHERE username = $1',
      [username]
    );
    console.log('User status check:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error checking user status:', error);
    throw error;
  }
};

// Add this function to update hero status
const updateHeroStatus = async (userId) => {
  try {
    const result = await client.query(
      'UPDATE users SET is_hero = true WHERE id = $1 RETURNING *',
      [userId]
    );
    console.log('Updated user status:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating hero status:', error);
    throw error;
  }
};



const createTables = async () => {
  const client = await connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables with CASCADE to handle dependencies
    await client.query(`DROP TABLE IF EXISTS users, heroes, reviews, requests, request_responses CASCADE`);

    // Create users table with is_hero field
    await client.query(`
      CREATE TABLE users(
        id UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        is_hero BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create heroes table
    await client.query(`
      CREATE TABLE heroes(
        id UUID PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reviews table
    await client.query(`
      CREATE TABLE reviews (
        id UUID PRIMARY KEY,
        hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create requests table
    await client.query(`
      CREATE TABLE requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        urgency VARCHAR(50) DEFAULT 'normal',
        contact_info TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create request_responses table
    await client.query(`
      CREATE TABLE request_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
        hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
        response_text TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS heroes_name_idx ON heroes(name);
      CREATE INDEX IF NOT EXISTS reviews_hero_id_idx ON reviews(hero_id);
      CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_hero_id ON requests(hero_id);
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
      CREATE INDEX IF NOT EXISTS idx_request_responses_request_id ON request_responses(request_id);
      CREATE INDEX IF NOT EXISTS idx_request_responses_hero_id ON request_responses(hero_id);
    `);

    await client.query('COMMIT');
    console.log('All tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  }
};

const createReview = async ({ heroId, userId, rating, reviewText }) => {
  // Input validation
  if (!heroId || !userId || !rating || !reviewText) {
    throw new Error('All fields are required');
  }

  if (!uuid.validate(heroId) || !uuid.validate(userId)) {
    throw new Error('Invalid hero or user ID');
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  if (typeof reviewText !== 'string' || reviewText.trim().length === 0) {
    throw new Error('Review text cannot be empty');
  }

  const client = await connect();
  try {
    await client.query('BEGIN');

    // Verify hero and user exist
    const heroExists = await client.query(
      'SELECT id FROM heroes WHERE id = $1',
      [heroId]
    );

    const userExists = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (heroExists.rows.length === 0) {
      throw new Error('Hero not found');
    }

    if (userExists.rows.length === 0) {
      throw new Error('User not found');
    }

    // Check for existing review
    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE hero_id = $1 AND user_id = $2',
      [heroId, userId]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await client.query(`
        UPDATE reviews 
        SET rating = $1, 
            review_text = $2, 
            updated_at = CURRENT_TIMESTAMP
        WHERE hero_id = $3 AND user_id = $4
        RETURNING id, hero_id, user_id, rating, review_text, created_at, updated_at
      `, [rating, reviewText, heroId, userId]);
    } else {
      // Create new review
      result = await client.query(`
        INSERT INTO reviews (id, hero_id, user_id, rating, review_text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, hero_id, user_id, rating, review_text, created_at, updated_at
      `, [uuid.v4(), heroId, userId, rating, reviewText]);
    }

    await client.query('COMMIT');
    return {
      ...result.rows[0],
      isUpdate: existingReview.rows.length > 0
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createReview:', error);
    throw new Error(`Error creating review: ${error.message}`);
  }
};


const getHeroReviews = async (heroId, limit = 10, offset = 0) => {
  if (!heroId || !uuid.validate(heroId)) {
    throw new Error('Invalid hero ID');
  }

  const client = await connect();
  try {
    // First verify hero exists
    const heroExists = await client.query(
      'SELECT id FROM heroes WHERE id = $1',
      [heroId]
    );

    if (heroExists.rows.length === 0) {
      throw new Error('Hero not found');
    }

    // Get reviews with user information
    const result = await client.query(`
      SELECT 
        r.id,
        r.rating,
        r.review_text,
        r.created_at,
        r.updated_at,
        u.username,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.hero_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [heroId, limit, offset]);

    // Get rating statistics
    const stats = await client.query(`
      SELECT 
        AVG(rating)::numeric(10,2) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE hero_id = $1
    `, [heroId]);

    return {
      reviews: result.rows,
      stats: stats.rows[0],
      pagination: {
        limit,
        offset,
        total: parseInt(stats.rows[0].total_reviews)
      }
    };

  } catch (error) {
    console.error('Error in getHeroReviews:', error);
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
};





const createUser = async ({ username, password, email }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const SQL = `
    INSERT INTO users(id, username, password, email, is_hero) 
    VALUES($1, $2, $3, $4, $5) 
    RETURNING *
  `;
  
  // Set is_hero to true if username is in HERO_USERNAMES
  const isHero = HERO_USERNAMES.includes(username);
  
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    hashedPassword,
    email,
    isHero
  ]);
  
  return response.rows[0];
};


// Function to insert initial heroes
const insertInitialHeroes = async () => {
  const client = await connect();
  try {
    const heroes = [
      { name: 'Aquaman', image: 'assets/images/Aquaman.jpg' },
      { name: 'Bane', image: 'assets/images/Bane.jpg' },
      { name: 'Batman', image: 'assets/images/Batman.jpg' },
      { name: 'Brainiac', image: 'assets/images/Brainiac.jpg' },
      { name: 'Canary', image: 'assets/images/Canary.jpg' },
      { name: 'Darkseid', image: 'assets/images/Darkseid.jpg' },
      { name: 'Flash', image: 'assets/images/Flash.jpg' },
      { name: 'Greenlantern', image: 'assets/images/Greenlantern.jpg' },
      { name: 'HawkGirl', image: 'assets/images/HawkGirl.jpg' },
      { name: 'Joker', image: 'assets/images/Joker.jpg' },
      { name: 'Lobo', image: 'assets/images/Lobo.jpg' },
      { name: 'NightWing', image: 'assets/images/NightWing.jpg' },
      { name: 'SolomonGrundy', image: 'assets/images/SolomonGrundy.jpg' },
      { name: 'Superman', image: 'assets/images/Superman.jpg' },
      { name: 'Vixen', image: 'assets/images/Vixen.jpg' },
      { name: 'WonderWoman', image: 'assets/images/WonderWoman.jpg' }
    ];
    await ensureHeroStatus();

    const values = heroes.map(hero =>
      `('${uuid.v4()}', '${hero.name}', 0.00, '', '${hero.image}')`
    ).join(',');
    
    await client.query(`
      INSERT INTO heroes (id, name, price, description, image)
      VALUES ${values}
      ON CONFLICT (name) DO NOTHING
    `);
  } catch(ex){
    console.error('Error inserting heroes:', ex);
    throw ex;
  }
};


const authenticateUser = async ({ username, password }) => {
  try {
    console.log('Authenticating user:', username);

    // First, ensure hero status is set correctly
    if (HERO_USERNAMES.includes(username)) {
      await client.query(`
        UPDATE users 
        SET is_hero = true 
        WHERE username = $1
      `, [username]);
    }

    const result = await client.query(
      'SELECT id, username, email, is_hero, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    console.log('Found user:', { ...user, password: '[HIDDEN]' });

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Generate token with is_hero included
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        is_hero: user.is_hero
      },
      process.env.JWT_SECRET || 'secrettoken',
      { expiresIn: '24h' }
    );

    // Remove password but keep is_hero
    const { password: _, ...userWithoutPassword } = user;
    console.log('Returning user data:', userWithoutPassword);

    return { 
      ...userWithoutPassword, 
      token,
      is_hero: user.is_hero
    };

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

const ensureHeroStatus = async () => {
  try {
    const placeholders = HERO_USERNAMES.map((_, idx) => `$${idx + 1}`).join(',');
    await client.query(`
      UPDATE users 
      SET is_hero = true 
      WHERE username IN (${placeholders})
    `, HERO_USERNAMES);
    
    console.log('Hero statuses updated successfully');
  } catch (error) {
    console.error('Error updating hero statuses:', error);
  }
};





const fetchUsers = async () => {
  try {
    const { rows } = await client.query(`
      SELECT id, username, email 
      FROM users
    `);
    return rows;
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    throw error;
  }
};

const fetchUserById = async (userId) => {
  try {
    const { rows: [user] } = await client.query(`
      SELECT 
        users.id,
        users.username,
        users.email,
        json_agg(
          json_build_object(
            'id', reviews.id,
            'rating', reviews.rating,
            'review_text', reviews.review_text,
            'created_at', reviews.created_at,
            'hero_id', reviews.hero_id,
            'user_id', reviews.user_id
          )
        ) FILTER (WHERE reviews.id IS NOT NULL) as "Reviews"
      FROM users
      LEFT JOIN reviews ON users.id = reviews.user_id
      WHERE users.id = $1
      GROUP BY users.id
    `, [userId]);

    if (!user) return null;
    
    // If no reviews, set Reviews to empty array instead of null
    if (!user.Reviews) {
      user.Reviews = [];
    }
    
    return user;
  } catch (error) {
    console.error('Error in fetchUserById:', error);
    throw error;
  }
};

const fetchHeroById = async (id) => {
  try {
    const { rows } = await client.query('SELECT * FROM heroes WHERE id = $1', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error in fetchHeroById:', error);
    throw error;
  }
};

const fetchHeroes = async () => {
  const client = await connect();
  try {
    const SQL = `
      SELECT id, name, image, created_at
      FROM heroes
      ORDER BY created_at DESC
    `;
    const response = await client.query(SQL);
    return response.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  } 
};


process.on('SIGINT', async () => {
  await client.end(); 
  process.exit(0);
});

module.exports = {
  client,
  updateReview,
  fetchUserById,
  createRequest,
  getUserRequests,
  getHeroRequests,
  createTables,
  createUser,
  authenticateUser,
  fetchUsers,
  fetchHeroById,
  insertInitialHeroes,
  fetchHeroes,
  createReview,
  getHeroReviews,
  deleteReview,
  deleteRequest,
  checkUserStatus, 
  updateHeroStatus,
  ensureHeroStatus,
};
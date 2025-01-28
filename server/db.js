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





const createTables = async () => {
  const client = await connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP TABLE IF EXISTS users, heroes CASCADE`);
    await client.query(`CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await client.query(`CREATE TABLE heroes(
      id UUID PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    
    await client.query(`
      CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS heroes_name_idx ON heroes(name);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS reviews_hero_id_idx ON reviews(hero_id);
      CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS heroes_name_idx ON heroes(name);
    `);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
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


// Function to delete a review
const deleteReview = async (reviewId, userId) => {
  const client = await connect();
  try {
    const result = await client.query(`
      DELETE FROM reviews 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [reviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Review not found or unauthorized');
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Error deleting review: ${error.message}`);
  }
};




// Function to create a user
const createUser = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters long');
  }  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const createUserStatement = {
    name: 'create-user',
    text: `INSERT INTO users(id, username, email, password) 
           VALUES($1, $2, $3, $4) 
           RETURNING id, username, email`
  };

  const client = await connect();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const values = [
      uuid.v4(), 
      username.toLowerCase(), 
      email.toLowerCase(), 
      hashedPassword
    ];
    
    const response = await client.query(createUserStatement, values);
    return response.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      if (error.detail.includes('email')) {
        throw new Error('Email already registered');
      }
      if (error.detail.includes('username')) {
        throw new Error('Username already exists');
      }
    }
    throw error;
  }
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
    console.log(heroes)
    const values = heroes.map(hero =>
      `('${uuid.v4()}', '${hero.name}', 0.00, '', '${hero.image}')`
    ).join(',');
    
    await client.query(`
      INSERT INTO heroes (id, name, price, description, image)
      VALUES ${values}
      ON CONFLICT (name) DO NOTHING
    `);
  } catch(ex){
    next(ex);
  }
};

// Function to authenticate user
const authenticateUser = async ({ email, password }) => {
  const client = await connect();  // Make sure we have a database connection
  try {
    console.log('Attempting to authenticate:', email); // Debug log

    // Query to find user by email
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    console.log('Query result:', result.rows.length); // Debug log

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;

  } catch (error) {
    console.error('Database authentication error:', error);
    throw error;
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
            'reviewText', reviews.review_text,
            'createdAt', reviews.created_at
          )
        ) as "Reviews"
      FROM users
      LEFT JOIN reviews ON users.id = reviews.user_id
      WHERE users.id = $1
      GROUP BY users.id
    `, [userId]);

    if (!user) return null;
    
    // If no reviews, set Reviews to empty array instead of null
    if (user.Reviews[0] === null) {
      user.Reviews = [];
    }
    
    return user;
  } catch (error) {
    console.error('Error in fetchUserById:', error);
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
  fetchUserById,
  createTables,
  createUser,
  authenticateUser,
  fetchUsers,
  insertInitialHeroes,
  fetchHeroes,
  createReview,
  getHeroReviews,
  deleteReview
};
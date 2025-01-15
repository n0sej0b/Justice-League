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
      CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
      CREATE INDEX IF NOT EXISTS heroes_name_idx ON heroes(name);
    `);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } 
};

// Function to create a user
const createUser = async ({ username, password }) => {
  if (!username || !password) {
    throw new Error('Username, password');
  }
  const createUserStatement = {
    name: 'create-user',
    text: `INSERT INTO users(id, username, password) 
           VALUES($1, $2, $3) 
           RETURNING id, username`
  };
  const client = await connect();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const values = [uuid.v4(), username, hashedPassword];
    const response = await client.query(createUserStatement, values);
    return response.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
};

// Function to insert initial heroes
const insertInitialHeroes = async () => {
  const client = await connect();
  try {
    const heroes = [
      { name: 'Aquaman', image: '/assets/images/Aquaman.jpg' },
      { name: 'Bane', image: '/assets/images/Bane.jpg' },
      { name: 'Batman', image: '/assets/images/Batman.jpg' },
      { name: 'Brainiac', image: '/assets/images/Brainiac.jpg' },
      { name: 'Canary', image: '/assets/images/Canary.jpg' },
      { name: 'Darkseid', image: '/assets/images/Darkseid.jpg' },
      { name: 'Flash', image: '/assets/images/Flash.jpg' },
      { name: 'Greenlantern', image: '/assets/images/Greenlantern.jpg' },
      { name: 'HawkGirl', image: '/assets/images/HawkGirl.jpg' },
      { name: 'Joker', image: '/assets/images/Joker.jpg' },
      { name: 'Lobo', image: '/assets/images/Lobo.jpg' },
      { name: 'NightWing', image: '/assets/images/NightWing.jpg' },
      { name: 'SolomonGrundy', image: '/assets/images/SolomonGrundy.jpg' },
      { name: 'Superman', image: '/assets/images/Superman.jpg' },
      { name: 'Vixen', image: '/assets/images/Vixen.jpg' },
      { name: 'WonderWoman', image: '/assets/images/WonderWoman.jpg' }
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


const fetchUsers = async () => {
  const client = await connect();
  try {
    const SQL = `
      SELECT id, username, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const response = await client.query(SQL);
    return response.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  } 
};

const fetchHeroes = async () => {
  const client = await connect();
  try {
    const SQL = `
      SELECT id, image, created_at
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
  createTables,
  createUser,
  fetchUsers,
  insertInitialHeroes,
  fetchHeroes,
};

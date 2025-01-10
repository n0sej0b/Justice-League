const pg = require('pg');
const client = new pg.Client('postgres://postgres@localhost');
const uuid = require('uuid');
const bcrypt = require('bcrypt');

const createTables = async() => {
  try {
    const SQL = `
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS heroes CASCADE;

      CREATE TABLE users(
          id UUID PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE heroes(
          id UUID PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          image VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(SQL);
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const createUser = async({ username, password, email }) => {
  try {
    const SQL = `
      INSERT INTO users(id, username, password, email) 
      VALUES($1, $2, $3, $4) 
      RETURNING id, username, email
    `;
    const hashedPassword = await bcrypt.hash(password, 10); // Increased salt rounds for better security
    const response = await client.query(SQL, [
      uuid.v4(),
      username,
      hashedPassword,
      email
    ]);
    return response.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const HeroesList = () => {
  const items = [
      {id: 1, name: 'Aquaman'},
      {id: 2, name: 'Bane'},
      {id: 3, name: 'Batman'},
      {id: 4, name: 'Brainiac'},
      {id: 5, name: 'Canary'},
      {id: 6, name: 'Darkseid'},
      {id: 7, name: 'Flash'},
      {id: 8, name: 'Greenlantern'},
      {id: 9, name: 'HawkGirl'},
      {id: 10, name: 'Joker'},
      {id: 11, name: 'Lobo'},
      {id: 12, name: 'NightWing'},
      {id: 13, name: 'SolomonGrundy'},
      {id: 14, name: 'Superman'},
      {id: 15, name: 'Vixen'},
      {id: 16, name: 'WonderWoman'}
  ];
  
  return items;
};

const fetchUsers = async() => {
  try {
    const SQL = `
      SELECT id, username, email, created_at
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

module.exports = {
  createTables,
  createUser,
  fetchUsers,
};

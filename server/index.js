const { client, createTables, createUser, fetchUsers, fetchHeroes, insertInitialHeroes } = require('./db');
const express = require('express');
const app = express(); 
const { isLoggedIn } = require('./middleware');
const cors = require('cors');

app.use(express.json()); 
app.use(cors());
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets/images', express.static(path.join(__dirname, './assets/images'))); 


app.get('/api/users', async (req, res, next) => {
    try {
        const users = await fetchUsers();
        res.send(users);
    } catch (ex) {
        next(ex); 
    }
});

app.get('/api/heroes', async (req, res, next) => {
  try {
      const users = await fetchHeroes();
      res.send(users);
  } catch (ex) {
      next(ex); 
  }
});

const seed = async () => {
      await createTables();
    console.log('tables created');
    await Promise.all([
        createUser({ username: 'superman', password: 'krypto' }),
        createUser({ username: 'joker', password: 'harley' }),
        createUser({ username: 'vixen', password: 'claws' }),
        createUser({ username: 'nightwing', password: 'dick' }),
        createUser({ username: 'lobo', password: 'power' }),
        createUser({ username: 'hawkgirl', password: 'hawktua' }),
        createUser({ username: 'bane', password: 'venom' }),
        createUser({ username: 'canary', password: 'decibel' }),
        createUser({ username: 'aquaman', password: 'fishie' }),
        createUser({ username: 'flash', password: 'reverse' }),
        createUser({ username: 'greenlantern', password: 'yellow' }),
        createUser({ username: 'batman', password: 'mommyissues' }),
        createUser({ username: 'wonderwoman', password: 'island' }),
        createUser({ username: 'darkseid', password: 'eyelazers' }),
        createUser({ username: 'solomongrundy', password: 'bornonmonday' }),
    ]);
  
    
    await insertInitialHeroes();  
    console.log('data seeded');
  }
  

  const init = async()=> {
    console.log('connecting to database');
    await client.connect();
  
    if(seedDb) {
      seed(); 
    }
  
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> console.log(`listening on port ${port}`));
  }
  
  const seedDb = true;


init();

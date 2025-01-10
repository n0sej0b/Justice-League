const { client, createTables, createUser, fetchUsers, initializeHeroes } = require('./db');
const express = require('express');
const app = express(); // Create an instance of the Express app

app.use(express.json()); // Middleware to parse incoming JSON

app.get('/api/users', async (req, res, next) => {
    try {
        const users = await fetchUsers();
        res.send(users);
    } catch (ex) {
        next(ex); // Pass error to the next middleware
    }
});

const init = async () => {
    try {
        console.log('Connecting to database...');
        await client.connect();
        await createTables();
        await initializeHeroes();

        const [superman, joker, vixen, nightwing, lobo, hawkgirl, bane, canary, aquaman, flash, greenlantern, batman, wonderwoman, darkseid, solomongrundy] = await Promise.all([
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
        console.log('Vixen ID:', vixen.id); // Example log for Vixen ID
    } catch (ex) {
        console.error('Error during initialization:', ex);
    }
};

init()
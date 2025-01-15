const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secrettoken';

// middleware function
function isLoggedIn(req, res, next) {
    try {
        
        const token = req.headers['authorization'];
        const { id } = jwt.verify(token, JWT_SECRET);
        if(req.params.userId) {
            if(id !== req.params.userId) {
                throw new Error('cannot access another user');
            }
        }
        
        res.user = id; 
        next();
    } catch(err) {
        next(err);
    }
}

module.exports = {
    isLoggedIn
}
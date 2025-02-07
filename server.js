const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken')
app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const SECRET_KEY = 'secret_key';
const users = [];
const highScores = [];

// Token auth middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization token required' });
  }
}

// Validation middleware for user credentials
function validateUserCredentials(req, res, next) {
  //create a variable to hold the key-value fields so their numbers can be specifically parsed
  const bodyFields = Object.keys(req.body);
  if (bodyFields.length !== 2 || !bodyFields.every(field => ['userHandle', 'password'].includes(field))) {
    return res.status(400).json({ message: 'Request must contain exactly userHandle and password' });
  }

  const { userHandle, password } = req.body;

  if (!userHandle || !password) {
    return res.status(400).json({ message: 'Both userHandle and password are required' });
  }

  if (typeof userHandle !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Both fields must be strings' });
  }

  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ message: 'Both fields must be at least 6 characters' });
  }

  next();
}

// Validation middleware for high score posting
function validateHighScore(req, res, next) {
  const requiredFields = ['level', 'userHandle', 'score', 'timestamp'];
  const bodyFields = Object.keys(req.body);

  // Check for exact fields match
  if (bodyFields.length !== requiredFields.length || 
      !requiredFields.every(field => bodyFields.includes(field))) {
    return res.status(400).json({ 
      message: 'Request must contain ONLY level, userHandle, score, and timestamp' 
    });
  }

  const { level, userHandle, score, timestamp } = req.body;

  if (!level || !userHandle || score === undefined || !timestamp) {
    return res.status(400).json({ 
      message: 'Missing required fields' 
    });
  }

  if (typeof level !== 'string' || typeof userHandle !== 'string' || 
      typeof score !== 'number' || typeof timestamp !== 'string') {
    return res.status(400).json({ 
      message: 'Invalid field types' 
    });
  }

  next();
}

// Registration endpoint
app.post('/signup', validateUserCredentials, (req, res) => {
  const { userHandle, password } = req.body;
  users.push({ userHandle, password });
  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', validateUserCredentials, (req, res) => {
  const { userHandle, password } = req.body;
  
  const user = users.find(user => 
    user.userHandle === userHandle && user.password === password
  );
  
  if (!user) {
    return res.status(401).json({ 
      message: 'Invalid credentials' 
    });
  }
  //sign token on successful validation
  const token = jwt.sign(
    { userHandle: user.userHandle }, 
    SECRET_KEY, 
    { expiresIn: '1h' }
  );

  res.status(200).json({
    jsonWebToken: token
  });
});

// POST high scores endpoint
app.post('/high-scores', authenticateJWT, validateHighScore, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  const newScore = { 
    level,
    userHandle,
    score,
    timestamp 
  };
  
  highScores.push(newScore);
  
  res.status(201).json(newScore);
});

// GET high scores endpoint
app.get('/high-scores', (req, res) => {
  const { level, page = 1 } = req.query;
  const pageSize = 20;  // Changed to 20 per page
  
  if (!level) {
    return res.status(400).json({ 
      message: 'Level parameter is required' 
    });
  }

  const scoresForLevel = highScores
    .filter(score => score.level === level)
    .sort((a, b) => b.score - a.score);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedScores = scoresForLevel.slice(startIndex, endIndex);

  res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};

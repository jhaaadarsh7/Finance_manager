const express = require('express');
const bcrypt = require('bcrypt'); // Fix typo
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

const SECRET =  process.env.JWT_SECRET;

// Initialize database before starting the server
const startServer = async () => {
  try {
    await initDb();
    
    // Add a simple root route for testing
    app.get('/', (req, res) => {
      res.send('Auth service is up and running!');
    });

    app.post("/signup", async (req, res) => {
      const { email, password } = req.body;
      const hash = await bcrypt.hash(password, 10);
      try {
        await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash]);
        res.status(201).json({ message: 'User created' });
      } catch (err) {
        // PostgreSQL unique violation error code is '23505'
        if (err.code === '23505') {
          res.status(409).json({ error: 'Email already exists' }); // 409 Conflict
        } else {
          console.error(err);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });
      
      // Set token in response header
      res.setHeader('Authorization', `Bearer ${token}`);
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email
        }
      });
    });

    const authMiddleware = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.sendStatus(401);

      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, SECRET);
        req.user = payload;
        next();
      } catch {
        res.sendStatus(403);
      }
    };

    app.get('/profile', authMiddleware, async (req, res) => {
      const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.userId]);
      res.json(result.rows[0]);
    });

    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => console.log(`Auth service running on port ${port}`));
  } catch (error) {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
};

startServer();


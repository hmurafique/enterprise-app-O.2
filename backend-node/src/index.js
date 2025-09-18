const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const cors = require('cors');

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://appuser:apppassword@postgres:5432/appdb';

const pool = new Pool({ connectionString: DATABASE_URL });
const redisClient = Redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
redisClient.connect().catch(err => console.error('Redis connect error', err));

const app = express();
app.use(express.json());
app.use(cors());

app.get('/api/health', async (req, res) => {
  try {
    const pg = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', pg: pg.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Node backend listening on ${PORT}`));

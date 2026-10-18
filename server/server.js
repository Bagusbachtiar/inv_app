require('dotenv').config(); // Load environment variables first
const express = require ('express');
const { Pool } = require('pg'); // Import the PostgreSQL Pool

const app = express();
const port = 3000;


// --- Database Connection Setup ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json());

// --- Mock Data Removal & Placeholder ---
// NOTE: We are removing the mock inventoryItems array here.
// We will replace this with actual DB queries in the next steps.


app.get('/', (req, res) => {
    res.send('Welcome to the Inventory API!');
});

// Placeholder for the Inventory Route (We will rewrite this next)
app.get('/api/inventory', async (req, res) => {
    // TODO: Implement actual DB query here in the next step.
    res.status(501).send({ message: "Database integration is pending. Mock data removal pending." });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
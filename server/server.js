require('dotenv').config(); // Load environment variables first
const express = require ('express');
const { Pool } = require('pg'); // Import the PostgreSQL Pool
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;


// --- Database Connection Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // <-- NEAON DB connection string from .env
});

// --- Database Connection Test ---
pool.query('SELECT 1 + 1 AS result')
  .then(() => console.log('✅ [DB] Successfully connected to Neon Postgres!'))
  .catch(err => {
    console.error('❌ [DB] CONNECTION FAILED:', err.message);
    // If connection fails, we might want to exit gracefully
    process.exit(1); 
  });

app.use(express.json());


// Endpoint to create a new inventory item
app.post('/api/inventory', async (req, res) => {
    // Destructure data from the request body
    const { name, quantity, price } = req.body; 

    // Basic validation check (A small piece of required logic)
    if (!name || quantity === undefined || price === undefined) {
        return res.status(400).send({ message: "Missing required fields: name, quantity, and price are required." });
    }

    try {
        // SQL Injection Prevention: ALWAYS use parameterized queries!
        const query = 'INSERT INTO inventory (name, quantity, price) VALUES ($1, $2, $3) RETURNING *';
        
        // $1, $2, $3 are placeholders for the values passed in the array
        const values = [name, quantity, price];

        const result = await pool.query(query, values);
        
        // Return the newly created item data (including its assigned ID)
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Database error while creating inventory item:', err.message);
        res.status(500).send({ message: 'Failed to create inventory item due to a server error.' });
    }
});// Endpoint to fetch all inventory items from the database

app.get('/api/inventory', async (req, res) => {
    try {
        // Query to select all necessary columns from the inventory table
        const result = await pool.query('SELECT id, name, quantity, price FROM inventory ORDER BY id ASC');
        
        // Send the rows back to the client as JSON
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Database query error while fetching inventory:', err.message);
        // If the DB fails for any reason, we return a 500 Internal Server Error
        res.status(500).send({ message: 'Error fetching inventory from the database.' });
    }
});

// Endpoint to update an existing inventory item (PATCH)
app.patch('/api/inventory/:id', async (req, res) => {
    const itemId = req.params.id;
    const { name, quantity, price } = req.body;

    try {
        // Dynamic query building to handle which fields might be present in the request body
        let query = 'UPDATE inventory SET ';
        let values = [];
        let count = 1;
        
        if (name) {
            query += `name = $${count++}, `;
            values.push(name);
        }
        if (quantity !== undefined) {
            query += `quantity = $${count++}, `;
            values.push(quantity);
        }
        if (price !== undefined) {
            query += `price = $${count++}, `;
            values.push(price);
        }

        // Remove the trailing comma and space before the WHERE clause
        query = query.slice(0, -2) + ` WHERE id = $${count} RETURNING *`;
        values.push(itemId);

        // Execute the update query
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: `Inventory item with ID ${itemId} not found.` });
        }

        // Return the updated record
        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Database error while updating inventory item:', err.message);
        res.status(500).send({ message: 'Failed to update inventory item due to a server error.' });
    }
});

// Endpoint to delete an inventory item
app.delete('/api/inventory/:id', async (req, res) => {
    const itemId = req.params.id;

    try {
        // Delete the record using a parameterized query
        const query = 'DELETE FROM inventory WHERE id = $1 RETURNING id';
        const values = [itemId];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: `Inventory item with ID ${itemId} not found.` });
        }

        // Return a success message (204 No Content is often used for successful deletes, but 200 with a message is clearer for this project)
        res.status(200).send({ message: `Inventory item with ID ${itemId} successfully deleted.` });

    } catch (err) {
        console.error('Database error while deleting inventory item:', err.message);
        res.status(500).send({ message: 'Failed to delete inventory item due to a server error.' });
    }
});

// Endpoint to handle user login and issue a JWT
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: "Email and password are required." });
    }

    try {
        // 1. Find the user in the database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).send({ message: "Invalid credentials." });
        }

        // 2. Compare the submitted password with the hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).send({ message: "Invalid credentials." });
        }

        // 3. Generate the JWT (Payload should only contain non-sensitive info like ID)
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 4. Send the token back to the client
        res.status(200).json({ token: token, message: "Login successful." });

    } catch (err) {
        console.error('Login process error:', err.message);
        res.status(500).send({ message: 'Login failed due to a server error.' });
    }
});

// START OF CODE SNIPPET FOR /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: "Email and password are required for registration." });
    }

    try {
        // 1. Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).send({ message: "User with this email already exists." });
        }

        // 2. Hash the password using bcrypt (AUTOMATION STEP)
        const saltRounds = 10; // Standard practice: 10 rounds is a good default
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Insert the user and the HASHED password into the database
        const query = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email';
        const values = [email, passwordHash];

        const result = await pool.query(query, values);
        
        // 4. Return the newly created user info (but not the password hash!)
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Registration process error:', err.message);
        res.status(500).send({ message: 'Registration failed due to a server error.' });
    }
});
// END OF CODE SNIPPET FOR /api/auth/register

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
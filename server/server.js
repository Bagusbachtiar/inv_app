require('dotenv').config(); // Load environment variables first
const express = require ('express');
const { Pool } = require('pg'); // Import the PostgreSQL Pool

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

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
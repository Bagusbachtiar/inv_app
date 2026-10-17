const express = require ('express');
const app = express();
const port = 3000;


const inventoryItems = [
  { id: 1, name: 'Laptop', quantity: 10, price: 1200.00 },
  { id: 2, name: 'Monitor', quantity: 15, price: 350.50 },
  { id: 3, name: 'Keyboard', quantity: 50, price: 75.99 }
];


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/inventory', (req, res) => {
  // Return the mock data as a JSON object
  res.json(inventoryItems);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
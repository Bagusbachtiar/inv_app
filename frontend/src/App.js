import React, { useState, useEffect } from 'react'; 
import './App.css';

function App() {
  // State to hold the JWT token once the user logs in
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  // State to manage UI views (e.g., Login, Dashboard, Register)
  const [view, setView] = useState('login'); 
  // State to hold inventory data
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch inventory data securely
  const fetchInventory = async () => {
    if (!token) {
        setError("No authentication token found. Please log in first.");
        return;
    }
    setLoading(true);
    setError(null);
    
    try {
        const response = await fetch('http://localhost:3000/api/inventory', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // <-- Token is included here!
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            setError('Token is invalid or expired. Please log in again.');
            setToken(null);
            localStorage.removeItem('authToken');
            setView('login');
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setInventory(data);

    } catch (err) {
        console.error("Fetch Error:", err);
        setError(`Failed to fetch inventory: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  // Effect runs when the token changes or when the view changes
  useEffect(() => {
    if (token && view === 'dashboard') {
        fetchInventory();
    }
  }, [token, view]); 

  // UPDATED: Login Handler (now sends to the real backend)
  const handleLogin = async (email, password) => {
    const loginUrl = 'http://localhost:3000/api/auth/login';
    
    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login failed due to server error.");
        }

        const data = await response.json();
        // Store token securely in localStorage
        localStorage.setItem('authToken', data.token); 
        setToken(data.token);
        setView('dashboard');

    } catch (err) {
        console.error("Login Error:", err);
        alert(`Login Failed: ${err.message}`);
    }
  };


  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Shop Inventory Manager</h1>
      
      {/* === VIEW HANDLING === */}
      {view === 'login' && (
        <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{textAlign: 'center'}}>Login</h2>
          {/* NOTE: Form inputs are placeholders and require dedicated state management for full functionality */}
          <div style={{marginBottom: '15px'}}> 
             <input 
              type="email" 
              placeholder="Email" 
              style={{marginRight: '10px', padding: '5px'}} 
             />
             <input 
              type="password" 
              placeholder="Password" 
              style={{padding: '5px'}} 
             />
             <button onClick={() => { /* Actual implementation will use form state */ }}>Login</button>
          </div>
          <p style={{textAlign: 'center'}}>*(Note: Form fields need dedicated state management for final version)*</p>
        </div>
      )}
      
      {view === 'dashboard' && (
        <div style={{ padding: '20px' }}>
          <h2 style={{textAlign: 'center'}}>Inventory Dashboard</h2>
          
          {/* Display Statuses */}
          {loading && <p style={{color: 'blue', textAlign: 'center'}}>Loading Inventory...</p>}
          {error && <p style={{color: 'red', textAlign: 'center'}}>ERROR: {error}</p>}
          
          {/* Display Inventory */}
          {!loading && !error && inventory.length > 0 && (
            <>
                <h3 style={{textAlign: 'center'}}>Current Inventory Items ({inventory.length})</h3>
                <ul style={{listStyle: 'none', padding: 0, textAlign: 'left'}}> 
                    {inventory.map(item => (
                        <li key={item.id} style={{borderBottom: '1px dotted #eee', padding: '10px 0'}}> 
                            <strong style={{fontSize: '1.1em'}}>{item.name}</strong> | Qty: {item.quantity} | Price: ${item.price} 
                        </li>
                    ))}
                </ul>
            </>
          )}
          {!loading && !error && inventory.length === 0 && (
             <p style={{textAlign: 'center'}}>Inventory is empty. Use the Register/Create endpoints to add items!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

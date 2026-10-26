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

  // State for form inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Function to fetch inventory data securely
  const fetchInventory = async () => {
    if (!token) {
        setError("No authentication token found. Please log in first.");
        return;
    }
    setLoading(true);
    setError(null);
    
    try {
        // Construct URL with pagination AND search term
        let url = 'http://localhost:3000/api/inventory';
        
        // Append search term if present
        if (searchTerm) {
            url = `${url}?search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url, {
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

  // Effect runs when the token changes, view changes, OR search term changes
  useEffect(() => {
    if (token && view === 'dashboard') {
        fetchInventory();
    }
  }, [token, view, searchTerm]); 

  // UPDATED: Login Handler (now sends to the real backend)
  const handleLogin = async (e) => {
    e.preventDefault(); // Stop default form submission behavior
    const loginUrl = 'http://localhost:3000/api/auth/login';
    
    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailInput, password: passwordInput }),
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
          {/* FORM IS NOW FULLY CONNECTED TO STATE AND THE HANDLER */}
          <form onSubmit={handleLogin}>
             <div style={{marginBottom: '15px'}}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  style={{marginRight: '10px', padding: '5px'}} 
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  style={{padding: '5px'}} 
                />
                <button type="submit">Login</button>
             </div>
             <p style={{textAlign: 'center'}}>*(This form is now fully functional!)*</p>
          </form>
        </div>
      )}
      
      {view === 'dashboard' && (
        <div style={{ padding: '20px' }}>
          <h2 style={{textAlign: 'center'}}>Inventory Dashboard</h2>
          
          {/* Search Bar Integration */}
          <div style={{marginBottom: '20px'}}> 
            <input 
                type="text" 
                placeholder="Search inventory by name..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{padding: '8px', width: '300px', marginRight: '10px'}}
            />
            <button onClick={() => fetchInventory()}>Apply Filters</button>
          </div>
          
          {/* Display Statuses */}
          {loading && <p style={{color: 'blue', textAlign: 'center'}}>Loading Inventory...</p>}
          {error && <p style={{color: 'red', textAlign: 'center'}}>ERROR: {error}</p>}
          
          {/* Display Inventory - TABLE FORMATTING */}
          {!loading && !error && inventory.length > 0 && (
            <>
                <h3 style={{textAlign: 'center'}}>Inventory Results ({inventory.length} found)</h3>
                <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}> 
                    <thead style={{borderBottom: '2px solid #333'}}> 
                        <tr>
                            <th style={{padding: '10px', textAlign: 'left'}}>ID</th>
                            <th style={{padding: '10px', textAlign: 'left'}}>Name</th>
                            <th style={{padding: '10px', textAlign: 'center'}}>Quantity</th>
                            <th style={{padding: '10px', textAlign: 'right'}}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => (
                            <tr key={item.id} style={{borderBottom: '1px dotted #eee'}}> 
                                <td style={{padding: '10px'}}>{item.id}</td>
                                <td style={{padding: '10px'}}>{item.name}</td>
                                <td style={{padding: '10px', textAlign: 'center'}}>{item.quantity}</td>
                                <td style={{padding: '10px', textAlign: 'right'}}>${item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
          )}
          {!loading && !error && inventory.length === 0 && (
             <p style={{textAlign: 'center'}}>No inventory found matching your criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

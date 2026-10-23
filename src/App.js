import React, { useState } from 'react';
import './App.css';

function App() {
  // State to hold the JWT token once the user logs in
  const [token, setToken] = useState(null); 

  // State to manage UI views (e.g., Login, Dashboard, Register)
  const [view, setView] = useState('login'); 

  // Placeholder function for the login action
  const handleLogin = async (email, password) => {
    console.log("Attempting Login for:", email);
    // NOTE: We will replace this with actual API calls later
    // For now, we mock success to move to the dashboard
    const mockToken = "MOCK_JWT_TOKEN_FOR_TESTING_PURPOSES";
    setToken(mockToken);
    setView('dashboard');
  };

  return (
    <div className="App">
      <h1>Shop Inventory Manager</h1>
      
      {/* Conditional rendering based on view state */}
      {view === 'login' && (
        <div>
          <h2>Logqin</h2>
          {/* Form components will go here later */}
          <button onClick={() => handleLogin('test@shop.com', 'password123')}>
              Simulate Login
          </button>
        </div>
      )}
      
      {view === 'dashboard' && (
        <div>
          <h2>Inventory Dashboard</h2>
          <p>Welcome! Your JWT Token is active. You can now fetch inventory.</p>
          {/* Inventory List component will go here */}
        </div>
      )}
    </div>
  );
}

export default App;
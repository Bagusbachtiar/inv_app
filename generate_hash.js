const bcrypt = require('bcrypt');

// The plain text password we want to hash
const plainPassword = 'password123'; 
// The salt rounds are standard for security
const saltRounds = 10; 

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error("Error generating hash:", err);
        return;
    }
    console.log("✅ Hash generated successfully!");
    console.log("==============================================");
    console.log("PASTE THIS ENTIRE STRING INTO YOUR SQL PASSWORD_HASH FIELD:");
    console.log(hash);
    console.log("==============================================");
});
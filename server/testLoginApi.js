require('dotenv').config();
const axios = require('axios');

// Define test credentials
const testCredentials = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'faculty1', password: 'faculty123', role: 'faculty' },
  { username: 'student1', password: 'student123', role: 'student' },
  { username: 'parent1', password: 'parent123', role: 'parent' }
];

async function testLoginApi() {
  const apiUrl = 'http://localhost:5000/api/auth/login';
  
  console.log('Testing Login API...');
  console.log('API URL:', apiUrl);
  
  for (const credentials of testCredentials) {
    try {
      console.log(`\nTesting login for ${credentials.username} (${credentials.role})...`);
      console.log('Request payload:', JSON.stringify(credentials));
      
      const response = await axios.post(apiUrl, credentials);
      
      console.log('Login successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data));
    } catch (error) {
      console.error('Login failed!');
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Error data:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('No response received');
        console.error('Request details:', error.request);
      } else {
        console.error('Error details:', error.message);
      }
    }
  }
}

// Run the test
testLoginApi().catch(error => {
  console.error('Test script error:', error);
}); 
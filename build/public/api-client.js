// api-client.js - Handles API calls with environment-aware configuration

// Determine if we're running in production
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
};

// Call OpenAI API either directly (local dev) or via Lambda proxy (production)
async function callOpenAI(requestBody) {
  try {
    if (isProduction()) {
      // In production, use the Lambda proxy
      const lambdaUrl = 'https://m51h9q02wh.execute-api.us-east-1.amazonaws.com/prod/openai-proxy';
      
      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      return await response.json();
    } else {
      // In local development, use the config.js file
      if (typeof CONFIG === 'undefined') {
        throw new Error('CONFIG is not defined. Make sure config.js is loaded.');
      }
      
      // Direct API call using the key from config.js
      const response = await fetch(CONFIG.API_ENDPOINTS.OPENAI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      return await response.json();
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Export the API client
window.ApiClient = {
  callOpenAI
};
// config.js - Store sensitive configuration values
// This file is for local development only and should not be committed to git

const CONFIG = {
  // API Keys - Use environment variables if available, fallback to hardcoded values for local dev
  OPENAI_API_KEY: '***REMOVED***',
  
  // API Endpoints
  API_ENDPOINTS: {
    OPENAI: 'https://api.openai.com/v1/chat/completions'
  }
};
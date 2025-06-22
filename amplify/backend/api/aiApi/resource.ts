import { defineAPI } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-functions';

// Define the Lambda function
const aiProxyFunction = defineFunction({
  name: 'aiProxyFunction',
  entry: './function/aiProxyFunction/index.js',
  environment: {
    // The API key will be set during deployment or via AWS console
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
  }
});

// Define the API
export const aiApi = defineAPI({
  name: 'aiApi',
  routes: [
    {
      path: '/openai',
      method: 'POST',
      function: aiProxyFunction
    }
  ]
});
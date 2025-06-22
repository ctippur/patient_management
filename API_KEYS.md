# API Key Management

This document explains how API keys are managed in this application for both local development and production deployment.

## Overview

The application uses the OpenAI API for generating clinical diagnoses. To securely handle the API key:

1. In local development, the key is stored in a local `config.js` file (not committed to git)
2. In production, the key is stored as an environment variable in AWS Lambda

## Local Development

1. Copy `public/config.template.js` to `public/config.js`
2. Add your OpenAI API key to the `OPENAI_API_KEY` field
3. The application will use this key for direct API calls during development

## Production Deployment

In production, API calls are proxied through an AWS Lambda function:

1. The Lambda function reads the API key from an environment variable
2. The frontend code calls the Lambda function instead of calling OpenAI directly
3. This keeps the API key secure and not exposed in client-side code

### Setting the Environment Variable

Set the `OPENAI_API_KEY` environment variable during deployment:

```bash
# Using the deployment script
OPENAI_API_KEY=your-api-key ./deploy.sh

# Or manually with Amplify CLI
amplify push --env-vars OPENAI_API_KEY=your-api-key
```

You can also set the environment variable in the AWS Console after deployment:
1. Go to AWS Lambda console
2. Find the `aiProxyFunction` function
3. Go to Configuration > Environment variables
4. Add or update the `OPENAI_API_KEY` variable

## How It Works

The application uses an API client (`api-client.js`) that automatically detects the environment:

1. In local development, it uses the key from `config.js` to call OpenAI directly
2. In AWS, it calls the Lambda proxy function, which uses the environment variable

This approach ensures that:
- API keys are never committed to the repository
- API keys are not exposed in client-side code in production
- The application works seamlessly in both environments
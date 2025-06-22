#!/bin/bash
# Deployment script for setting environment variables and deploying to AWS

# Check if OPENAI_API_KEY is provided
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is required"
  echo "Usage: OPENAI_API_KEY=your-api-key ./deploy.sh [environment]"
  exit 1
fi

# Get environment name (default to dev)
ENV=${1:-dev}

echo "Deploying to $ENV environment with API key..."

# Deploy with environment variables
amplify push --env $ENV --yes --env-vars OPENAI_API_KEY=$OPENAI_API_KEY

echo "Deployment complete!"
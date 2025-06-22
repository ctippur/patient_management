## AWS Amplify React+Vite Starter Template

This repository provides a starter template for creating applications using React+Vite and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational React application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.
- **AI Integration**: OpenAI API integration for clinical diagnosis support.

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Copy `public/config.template.js` to `public/config.js` and add your API keys
4. Run the development server with `npm run dev`

## API Keys

This application uses external APIs that require authentication:

### Local Development
For local development:
1. Copy `public/config.template.js` to `public/config.js`
2. Add your OpenAI API key to the `OPENAI_API_KEY` field
3. The `config.js` file is included in `.gitignore` to prevent committing API keys

### Production Deployment
For production deployment:

1. Deploy the frontend using Amplify Console
2. Deploy the Lambda function and API Gateway separately using the scripts in the `lambda` directory
3. Update the API endpoint URL in `public/api-client.js` before deploying the frontend

See the `lambda/DEPLOYMENT.md` file for detailed instructions on setting up the Lambda function and API Gateway.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
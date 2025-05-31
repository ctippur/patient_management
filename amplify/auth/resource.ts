import { defineAuth } from '@aws-amplify/backend-auth';

export const auth = defineAuth({
  loginWith: {
    email: true,
    oauth: {
      google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        scopes: ['profile', 'email', 'openid']
      }
    }
  },
  userAttributes: {
    profilePicture: {
      mutable: true,
      required: false
    }
  }
});
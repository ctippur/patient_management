import { defineAuth } from '@aws-amplify/backend-auth';

export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    profilePicture: {
      mutable: true,
      required: false
    }
  }
});
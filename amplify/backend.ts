import { defineBackend } from '@aws-amplify/backend';
import { defineAuth } from '@aws-amplify/backend-auth';
import { defineData } from '@aws-amplify/backend-data';

const backend = defineBackend({
  auth: defineAuth({
    loginWith: {
      email: true
    }
  }),
  data: defineData({
    schema: `
      type Patient @model @auth(rules: [
        { allow: owner, operations: [create, read, update, delete] },
        { allow: private, operations: [read] }
      ]) {
        id: ID! @primaryKey
        name: String!
        dob: AWSDate!
        email: AWSEmail
        phone: String
        createdAt: AWSDateTime! @readOnly
        updatedAt: AWSDateTime! @readOnly
      }
    `
  })
});

export default backend;
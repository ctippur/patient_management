import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Patient: a
    .model({
      name: a.string().required(),
      dob: a.date().required(),
      email: a.email(),
      phone: a.string(),
      createdBy: a.string()
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});
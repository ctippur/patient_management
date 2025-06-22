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
    ]),
  
  ClinicalExam: a
    .model({
      patientId: a.string().required(),
      date: a.string().required(),
      results: a.string().required(), // JSON string of results
      summary: a.string()
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),
    
  PatientHistory: a
    .model({
      patientId: a.string().required(),
      chiefComplaint: a.string(),
      historyPresentIllness: a.string(),
      pastMedicalHistory: a.string(),
      medications: a.string(),
      allergies: a.string(),
      familyHistory: a.string(),
      socialHistory: a.string()
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),
    
  // In amplify/data/resource.ts
  Visit: a
    .model({
      patientId: a.string().required(),
      date: a.string().required(),
      clinicalExam: a.json().required(), // Contains results and summary
      instrumentalEvaluation: a.json(), // Contains notes and fileKey
      diagnosis: a.string(), // Add this field to store the diagnosis
      diagnosisStatus: a.string() // Add this field to track status (pending, completed)
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),

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

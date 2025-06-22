import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { aiApi } from './backend/api/aiApi/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  api: {
    aiApi
  }
});

export default backend;
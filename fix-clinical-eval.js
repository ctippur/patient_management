// Fix redirects in clinical_eval.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file
const filePath = path.join(__dirname, 'public', 'clinical_eval.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace window.location.href redirects
content = content.replace(/window\.location\.href\s*=\s*['"]dashboard\.html['"]/g, 'navigateToDashboard()');
content = content.replace(/window\.location\.href\s*=\s*['"]\/dashboard\.html['"]/g, 'navigateToDashboard()');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Redirects fixed in clinical_eval.js');
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

// Replace all window.location.href redirects
content = content.replace(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/g, (match, url) => {
  // If the URL starts with a slash, remove it
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  
  // Replace with navigateTo function
  return `navigateTo('${url}')`;
});

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Redirects fixed in clinical_eval.js');
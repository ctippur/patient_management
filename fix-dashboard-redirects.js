// Fix redirects in dashboard.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file
const filePath = path.join(__dirname, 'public', 'dashboard.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all window.location.href redirects
content = content.replace(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/g, (match, url) => {
  // If the URL starts with a slash, remove it
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  
  // Replace with navigateTo function
  if (url === '/') {
    return `navigateToHome()`;
  } else if (url === 'dashboard.html') {
    return `navigateToDashboard()`;
  } else {
    return `navigateTo('${url}')`;
  }
});

// Fix links in HTML templates
content = content.replace(/href="\/([^"]+)"/g, 'href="$1"');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Redirects fixed in dashboard.js');
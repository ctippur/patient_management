// redirect-handler.js - Simple utility to handle redirects properly

// Function to get the base URL that works in both local and deployed environments
function getBaseUrl() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  
  // Check if we're in the public directory
  if (pathname.includes('/public/')) {
    return origin;
  } else {
    return origin;
  }
}

// Function to navigate to dashboard
function navigateToDashboard() {
  window.location.href = getBaseUrl() + '/dashboard.html';
}

// Function to navigate to home/index
function navigateToHome() {
  window.location.href = getBaseUrl() + '/index.html';
}

// Function to navigate to login
function navigateToLogin() {
  window.location.href = getBaseUrl() + '/login.html';
}

// Function to navigate to any page
function navigateTo(page) {
  window.location.href = getBaseUrl() + '/' + page;
}

// Make functions available globally
window.navigateToDashboard = navigateToDashboard;
window.navigateToHome = navigateToHome;
window.navigateToLogin = navigateToLogin;
window.navigateTo = navigateTo;
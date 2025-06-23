// redirect-handler.js - Simple utility to handle redirects properly

// Function to navigate to dashboard
function navigateToDashboard() {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/dashboard.html';
}

// Function to navigate to home/index
function navigateToHome() {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/index.html';
}

// Function to navigate to login
function navigateToLogin() {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/login.html';
}

// Function to navigate to any page
function navigateTo(page) {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/' + page;
}

// Make functions available globally
window.navigateToDashboard = navigateToDashboard;
window.navigateToHome = navigateToHome;
window.navigateToLogin = navigateToLogin;
window.navigateTo = navigateTo;
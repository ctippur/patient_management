// redirect-handler.js - Simple utility to handle redirects properly

// Function to navigate to dashboard
function navigateToDashboard() {
  window.location.href = '/dashboard.html';
}

// Function to navigate to home/index
function navigateToHome() {
  window.location.href = '/index.html';
}

// Function to navigate to login
function navigateToLogin() {
  window.location.href = '/login.html';
}

// Function to navigate to any page
function navigateTo(page) {
  window.location.href = '/' + page;
}

// Make functions available globally
window.navigateToDashboard = navigateToDashboard;
window.navigateToHome = navigateToHome;
window.navigateToLogin = navigateToLogin;
window.navigateTo = navigateTo;
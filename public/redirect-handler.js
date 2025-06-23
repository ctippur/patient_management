// redirect-handler.js - Simple utility to handle redirects properly

// Function to navigate to dashboard
function navigateToDashboard() {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/public/dashboard.html';
}

// Function to navigate to home/index
function navigateToHome() {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/public/index.html';
}

// Function to navigate to any page
function navigateTo(page) {
  const baseUrl = window.location.origin;
  window.location.href = baseUrl + '/public/' + page;
}

// Make functions available globally
window.navigateToDashboard = navigateToDashboard;
window.navigateToHome = navigateToHome;
window.navigateTo = navigateTo;
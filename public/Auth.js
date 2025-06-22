// Auth.js - Authentication helper functions for the public folder

// Show toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.classList.toggle('text-bg-danger', isError);
  toast.classList.toggle('text-bg-primary', !isError);
  
  const toastBody = toast.querySelector('.toast-body');
  if (toastBody) toastBody.textContent = message;
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Handle login with AWS Amplify
async function handleLogin(username, password) {
  try {
    console.log('Attempting to sign in user:', username);
    
    // Make sure AWS is defined before using it
    if (!AWS || !AWS.Auth) {
      console.error('AWS or AWS.Auth is not defined. Make sure AWS Amplify is loaded.');
      showToast('Authentication service not available', true);
      return { success: false, error: 'Authentication service not available' };
    }
    
    const result = await AWS.Auth.signIn(username, password);
    console.log('Sign in successful');
    showToast('Login successful!');
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
    
    return { success: true, user: result };
  } catch (error) {
    console.error('Error signing in:', error.message, error.code);
    showToast(`Login failed: ${error.message}`, true);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in. Please check your credentials.'
    };
  }
}

// Handle registration
async function handleRegister(username, password) {
  try {
    if (!AWS || !AWS.Auth) {
      console.error('AWS or AWS.Auth is not defined');
      showToast('Authentication service not available', true);
      return { success: false };
    }
    
    const result = await AWS.Auth.signUp({
      username,
      password,
      attributes: {
        email: username
      }
    });
    
    showToast('Registration successful! Please check your email for verification code.');
    return { success: true, result };
  } catch (error) {
    console.error('Error signing up:', error);
    showToast(`Registration failed: ${error.message}`, true);
    return { success: false, error };
  }
}

// Handle logout
async function handleLogout() {
  try {
    if (!AWS || !AWS.Auth) {
      console.error('AWS or AWS.Auth is not defined');
      return { success: false };
    }
    
    await AWS.Auth.signOut();
    showToast('Logged out successfully!');
    window.location.href = './index.html';
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    showToast(`Logout failed: ${error.message}`, true);
    return { success: false, error };
  }
}

// Make functions available globally
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
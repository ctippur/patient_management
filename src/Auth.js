// Auth.js - Authentication module
import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  signOut,
  getCurrentUser
} from 'aws-amplify/auth';
import config from '../amplify_outputs.json';

// Configure Amplify
Amplify.configure(config);

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

// Show a specific view and hide others
function showView(viewId) {
  document.querySelectorAll('.auth-view').forEach(view => {
    view.classList.add('d-none');
  });
  const view = document.getElementById(viewId);
  if (view) view.classList.remove('d-none');
}

// Handle login
async function handleLogin(username, password) {
  try {
    console.log('Attempting to sign in user:', username);
    console.log('Using Cognito config:', {
      userPoolId: AWS.Amplify.getConfig().Auth.userPoolId,
      userPoolClientId: AWS.Amplify.getConfig().Auth.userPoolClientId
    });
    
    // Try with different authentication parameters
    const result = await AWS.Auth.signIn({
      username: username,
      password: password
    });
    
    console.log('Sign in successful');
    return { success: true, user: result };
  } catch (error) {
    // Log detailed error information
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.code === 'UserNotConfirmedException') {
      // Handle unconfirmed user
      showToast('Please confirm your email before logging in', true);
    } else if (error.code === 'NotAuthorizedException') {
      // Handle incorrect password
      showToast('Incorrect username or password', true);
    } else if (error.code === 'UserNotFoundException') {
      // Handle user not found
      showToast('User does not exist', true);
    }
    
    return { success: false, error: error.message };
  }
}


// Handle registration
async function handleRegister() {
  try {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!email || !password) {
      showToast('Please enter both email and password', true);
      return;
    }
    
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email
        },
        autoSignIn: true
      }
    });
    
    showToast('Registration successful! Please check your email for verification code.');
    
    // Pre-fill email in confirmation form
    const confirmEmail = document.getElementById('confirm-email');
    if (confirmEmail) confirmEmail.value = email;
    
    showView('confirm-view');
  } catch (error) {
    console.error('Error signing up:', error.message);
    showToast(`Registration failed: ${error.message}`, true);
  }
}

// Handle confirmation
async function handleConfirm() {
  try {
    const email = document.getElementById('confirm-email').value;
    const code = document.getElementById('confirm-code').value;
    
    if (!email || !code) {
      showToast('Please enter both email and verification code', true);
      return;
    }
    
    await confirmSignUp({
      username: email,
      confirmationCode: code
    });
    
    showToast('Email confirmed! You can now login.');
    showView('login-view');
  } catch (error) {
    console.error('Error confirming sign up:', error.message);
    showToast(`Confirmation failed: ${error.message}`, true);
  }
}

// Handle password reset request
async function handleResetRequest() {
  try {
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
      showToast('Please enter your email', true);
      return;
    }
    
    await resetPassword({ username: email });
    
    showToast('Reset code sent! Check your email.');
    
    // Pre-fill email in reset confirmation form
    const resetConfirmEmail = document.getElementById('reset-confirm-email');
    if (resetConfirmEmail) resetConfirmEmail.value = email;
    
    showView('reset-confirm-view');
  } catch (error) {
    console.error('Error requesting password reset:', error.message);
    showToast(`Reset request failed: ${error.message}`, true);
  }
}

// Handle password reset confirmation
async function handleResetConfirm() {
  try {
    const email = document.getElementById('reset-confirm-email').value;
    const code = document.getElementById('reset-code').value;
    const newPassword = document.getElementById('reset-new-password').value;
    
    if (!email || !code || !newPassword) {
      showToast('Please fill all fields', true);
      return;
    }
    
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword
    });
    
    showToast('Password updated successfully! You can now login.');
    showView('login-view');
  } catch (error) {
    console.error('Error confirming password reset:', error.message);
    showToast(`Password reset failed: ${error.message}`, true);
  }
}

// Handle logout
async function handleLogout() {
  try {
    await signOut();
    showToast('Logged out successfully!');
    showView('login-view');
  } catch (error) {
    console.error('Error signing out:', error.message);
    showToast(`Logout failed: ${error.message}`, true);
  }
}

// Check if user is already logged in
async function checkAuthState() {
  try {
    const user = await getCurrentUser();
    console.log('User is signed in:', user);
    
    // Display user info
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `Logged in as: ${user.signInDetails?.loginId || user.username}`;
    }
    
    // Redirect to dashboard
    window.location.href = '/public/dashboard.html';
  } catch (error) {
    console.log('User is not signed in');
    showView('login-view');
  }
}

async function handleForgotPassword(username) {
  try {
    console.log('Requesting password reset for:', username);
    
    await AWS.Auth.forgotPassword(username);
    
    console.log('Password reset code sent successfully');
    showToast('Password reset code sent to your email', false);
    return { success: true };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    showToast(`Failed to send reset code: ${error.message}`, true);
    return { success: false, error: error.message };
  }
}




// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication state
  checkAuthState();
  
  // Login view
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('link-to-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    showView('register-view');
  });
  document.getElementById('link-to-reset')?.addEventListener('click', (e) => {
    e.preventDefault();
    showView('reset-view');
  });
  
  // Register view
  document.getElementById('register-btn')?.addEventListener('click', handleRegister);
  document.getElementById('link-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    showView('login-view');
  });
  
  // Confirm view
  document.getElementById('confirm-btn')?.addEventListener('click', handleConfirm);
  
  // Reset view
  document.getElementById('reset-btn')?.addEventListener('click', handleResetRequest);
  
  // Reset confirm view
  document.getElementById('reset-confirm-btn')?.addEventListener('click', handleResetConfirm);
  
  // Dashboard view
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
});

// Make functions available globally
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleConfirm = handleConfirm;
window.handleResetRequest = handleResetRequest;
window.handleResetConfirm = handleResetConfirm;
window.handleLogout = handleLogout;
// Make it available globally
window.handleForgotPassword = handleForgotPassword;
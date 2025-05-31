// src/Auth.js
import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  signIn,
  signInWithRedirect,
  signOut,
  getCurrentUser,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword
} from 'aws-amplify/auth';
import outputs from '../amplify_outputs';
console.log(outputs);
Amplify.configure(outputs);

function showView(id) {
  document.querySelectorAll('.auth-view').forEach((el) => el.classList.add('d-none'));
  document.getElementById(id).classList.remove('d-none');
}

function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  toast.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'} show`;
  toast.querySelector('.toast-body').textContent = message;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ========== LOGIN ==========
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await signIn({ username: email, password });
    const user = await getCurrentUser();
    window.location.href = 'dashboard.html';
  } catch (err) {
    showToast(`Login failed: ${err.message}`, false);
  }
}

// ========== GOOGLE LOGIN ==========
async function handleGoogleLogin() {
  try {
    await signInWithRedirect({ provider: 'Google' });
  } catch (err) {
    showToast(`Google login failed: ${err.message}`, false);
  }
}

// ========== SIGNUP ==========
async function handleRegister() {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
    showToast('Verification code sent to email. Confirm below.');
    showView('confirm-view');
  } catch (err) {
    showToast(`Registration failed: ${err.message}`, false);
  }
}

async function handleConfirmSignup() {
  const email = document.getElementById('confirm-email').value;
  const code = document.getElementById('confirm-code').value;

  try {
    await confirmSignUp({ username: email, confirmationCode: code });
    showToast('Email confirmed! You may now log in.');
    showView('login-view');
  } catch (err) {
    showToast(`Confirmation failed: ${err.message}`, false);
  }
}

// ========== RESET PASSWORD ==========
async function handleRequestReset() {
  const email = document.getElementById('reset-email').value;
  try {
    await resetPassword({ username: email });
    showToast('Reset code sent. Enter it below.');
    showView('reset-confirm-view');
  } catch (err) {
    showToast(`Reset failed: ${err.message}`, false);
  }
}

async function handleConfirmReset() {
  const email = document.getElementById('reset-confirm-email').value;
  const code = document.getElementById('reset-code').value;
  const newPassword = document.getElementById('reset-new-password').value;

  try {
    await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
    showToast('Password updated! You may now log in.');
    showView('login-view');
  } catch (err) {
    showToast(`Password reset failed: ${err.message}`, false);
  }
}

// ========== LOGOUT ==========
async function handleLogout() {
  await signOut();
  showToast('Signed out');
  showView('login-view');
}

// ========== CHECK SESSION ==========
async function checkSession() {
  try {
    const session = await fetchAuthSession();
    if (session) {
      const user = await getCurrentUser();
      window.location.href = 'dashboard.html';
    }
  } catch {
    showView('login-view');
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('google-btn').addEventListener('click', handleGoogleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('confirm-btn').addEventListener('click', handleConfirmSignup);
  document.getElementById('reset-btn').addEventListener('click', handleRequestReset);
  document.getElementById('reset-confirm-btn').addEventListener('click', handleConfirmReset);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  document.getElementById('link-to-register').addEventListener('click', () => showView('register-view'));
  document.getElementById('link-to-login').addEventListener('click', () => showView('login-view'));
  document.getElementById('link-to-reset').addEventListener('click', () => showView('reset-view'));

  checkSession();
});
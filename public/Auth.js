// Auth.js - Authentication helper functions for the public folder

// Show toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) {
    // Create a toast element if it doesn't exist
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    
    const toastElement = document.createElement('div');
    toastElement.id = 'toast';
    toastElement.className = `toast align-items-center ${isError ? 'text-bg-danger' : 'text-bg-primary'} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    toastContainer.appendChild(toastElement);
    document.body.appendChild(toastContainer);
    
    const bsToast = new bootstrap.Toast(toastElement);
    bsToast.show();
    return;
  }
  
  toast.classList.toggle('text-bg-danger', isError);
  toast.classList.toggle('text-bg-primary', !isError);
  
  const toastBody = toast.querySelector('.toast-body');
  if (toastBody) toastBody.textContent = message;
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Handle login with simple localStorage authentication
async function handleLogin(username, password) {
  try {
    console.log('Attempting to sign in user:', username);
    
    // Simple demo authentication
    if (username && password) {
      // Store auth info in localStorage
      localStorage.setItem('accessToken', 'demo-token-' + Date.now());
      localStorage.setItem('idToken', 'demo-id-token-' + Date.now());
      localStorage.setItem('userEmail', username);
      
      console.log('Sign in successful');
      showToast('Login successful!');
      
      // Create some sample patient data
      const samplePatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dob: '1980-05-15',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          createdAt: new Date().toISOString()
        },
        {
          id: 'patient-2',
          name: 'Jane Smith',
          dob: '1975-10-20',
          email: 'jane.smith@example.com',
          phone: '555-987-6543',
          createdAt: new Date().toISOString()
        }
      ];
      
      // Store sample patient data
      localStorage.setItem('patients', JSON.stringify(samplePatients));
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
      
      return { success: true, user: { username } };
    } else {
      throw new Error('Email and password are required');
    }
  } catch (error) {
    console.error('Error signing in:', error.message);
    showToast(`Login failed: ${error.message}`, true);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in. Please check your credentials.'
    };
  }
}

// Handle logout
async function handleLogout() {
  try {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('userEmail');
    
    showToast('Logged out successfully!');
    
    // Redirect to home
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1000);
    
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    showToast(`Logout failed: ${error.message}`, true);
    return { success: false, error };
  }
}

// Make functions available globally
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
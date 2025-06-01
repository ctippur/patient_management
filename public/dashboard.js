// dashboard.js - Using global AWS Amplify from CDN

// Toast display utility
function showToast(message, isError = false) {
  const toast = document.getElementById('app-toast');
  if (!toast) {
    console.warn('Toast element not found');
    alert(message); // Fallback to alert if toast element not found
    return;
  }
  
  const toastBody = toast.querySelector('.toast-body');
  if (toastBody) {
    toastBody.textContent = message;
  }
  
  try {
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } catch (error) {
    console.error('Error showing toast:', error);
    alert(message); // Fallback to alert if bootstrap Toast fails
  }
}

// Configure Amplify with the outputs
async function configureAmplify() {
  try {
    const response = await fetch('./amplify_outputs.json');
    const config = await response.json();
    console.log('Loaded Amplify config');
    
    AWS.Amplify.configure(config);
    console.log('Amplify configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    showToast('Failed to initialize application. Please refresh and try again.', true);
    return false;
  }
}

async function loadDashboard() {
  try {
    // Configure Amplify first
    const configured = await configureAmplify();
    if (!configured) return;
    
    const user = await AWS.Auth.getCurrentUser();
    const greeting = document.getElementById('user-greeting');
    if (greeting) {
      greeting.textContent = `Welcome, ${user.signInDetails?.loginId || user.username}`;
    }
    await listPatients();
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    showToast('Failed to fetch user session.', true);
  }
}

async function listPatients() {
  try {
    const user = await AWS.Auth.getCurrentUser();
    const userId = user.username;
    console.log('Current user ID:', userId);

    const client = AWS.Amplify.generateClient();
    // Use a filter to only fetch patients created by the current user
    // This is more secure and efficient than fetching all patients
    const result = await client.models.Patient.list({
      filter: { createdBy: { eq: userId } }
    });
    
    // Don't log patient data to console in production for HIPAA compliance
    console.log('Patient list fetched successfully');
    
    const patients = result.data || [];
    
    const container = document.getElementById('patient-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (patients.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No patients found. Add your first patient!</div>';
      return;
    }

    userPatients.forEach(patient => {
      const div = document.createElement('div');
      div.className = 'card my-2 p-3';
      div.innerHTML = `
        <h5>${patient.name}</h5>
        <p>Email: ${patient.email || 'N/A'}</p>
        <p>DOB: ${patient.dob}</p>
        <p>Phone: ${patient.phone || 'N/A'}</p>
        <div class="mt-2">
          <button class="btn btn-primary btn-sm me-2 edit-btn" data-id="${patient.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${patient.id}">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEditPatient(btn.dataset.id));
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeletePatient(btn.dataset.id));
    });
  } catch (error) {
    console.error('Failed to load patients:', error);
    showToast('Error loading patients: ' + error.message, true);
  }
}

// Function for direct calls from HTML
export async function addPatient(patientData) {
  try {
    // Configure Amplify first if needed
    await configureAmplify();
    
    // Don't log PHI to console for HIPAA compliance
    console.log('Processing patient data');
    
    const { name, dob, email, phone, id } = patientData;
    
    if (!name || !dob || !email) {
      showToast('Name, DOB, and Email are required.', true);
      return;
    }

    const user = await AWS.Auth.getCurrentUser();
    const createdBy = user.username;
    
    const client = AWS.Amplify.generateClient();
    
    if (id) {
      // First verify this patient belongs to the current user
      const { data: existingPatient } = await client.models.Patient.get({ id });
      if (!existingPatient || existingPatient.createdBy !== createdBy) {
        console.error('Unauthorized patient update attempt');
        showToast('You are not authorized to update this patient record.', true);
        return;
      }
      
      const result = await client.models.Patient.update({
        id,
        name,
        dob,
        email,
        phone,
        createdBy
      });
      
      console.log('Patient updated successfully');
      showToast('Patient updated successfully!');
    } else {
      const result = await client.models.Patient.create({
        name,
        dob,
        email,
        phone,
        createdBy
      });
      
      console.log('Patient created successfully');
      showToast('Patient added successfully!');
    }
    
    await listPatients();
  } catch (error) {
    console.error('Error saving patient:', error);
    showToast('Failed to save patient: ' + error.message, true);
  }
}

// Form handler for submit event
export async function handleAddPatient(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  
  console.log('Add patient form submitted');
  
  const name = document.getElementById('patient-name')?.value.trim();
  const dob = document.getElementById('patient-dob')?.value;
  const email = document.getElementById('patient-email')?.value.trim();
  const phone = document.getElementById('patient-phone')?.value.trim();
  const id = document.getElementById('patient-id')?.value;

  console.log('Form values:', { name, dob, email, phone, id });
  
  await addPatient({ name, dob, email, phone, id });
  
  const form = document.getElementById('add-patient-form');
  if (form) {
    form.reset();
    console.log('Form reset');
  }
  
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.textContent = 'Add Patient';
  
  // Close modal if it exists
  try {
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
    if (modal) {
      modal.hide();
      console.log('Modal hidden');
    }
  } catch (error) {
    console.error('Error hiding modal:', error);
  }
}

async function handleSearch() {
  const query = document.getElementById('search-query')?.value.toLowerCase() || '';
  console.log('Searching for patients');
  
  try {
    await configureAmplify();
    const client = AWS.Amplify.generateClient();
    const user = await AWS.Auth.getCurrentUser();
    const userId = user.username;
    
    // Only fetch patients created by the current user
    const result = await client.models.Patient.list({
      filter: { createdBy: { eq: userId } }
    });
    
    const patients = result.data || [];
    
    const container = document.getElementById('patient-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Apply client-side search filter
    const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.email && p.email.toLowerCase().includes(query))
    );
    
    console.log('Filtered search results:', filtered);
    
    if (filtered.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No matching patients found.</div>';
      return;
    }
    
    filtered.forEach(patient => {
      const div = document.createElement('div');
      div.className = 'card my-2 p-3';
      div.innerHTML = `
        <h5>${patient.name}</h5>
        <p>Email: ${patient.email || 'N/A'}</p>
        <p>DOB: ${patient.dob}</p>
        <p>Phone: ${patient.phone || 'N/A'}</p>
        <div class="mt-2">
          <button class="btn btn-primary btn-sm me-2 edit-btn" data-id="${patient.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${patient.id}">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEditPatient(btn.dataset.id));
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeletePatient(btn.dataset.id));
    });
  } catch (error) {
    console.error('Search failed:', error);
    showToast('Failed to search patients: ' + error.message, true);
  }
}

async function handleLogout() {
  try {
    await configureAmplify();
    await AWS.Auth.signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Failed to logout: ' + error.message, true);
  }
}

async function handleEditPatient(id) {
  try {
    await configureAmplify();
    console.log('Processing edit request');
    
    const client = AWS.Amplify.generateClient();
    const user = await AWS.Auth.getCurrentUser();
    const userId = user.username;
    
    const result = await client.models.Patient.get({ id });
    const patient = result.data;
    
    if (!patient) {
      showToast('Patient not found.', true);
      return;
    }
    
    // Verify this patient belongs to the current user
    if (patient.createdBy !== userId) {
      console.error('Unauthorized patient edit attempt');
      showToast('You are not authorized to edit this patient record.', true);
      return;
    }

    // Don't log PHI to console for HIPAA compliance
    console.log('Patient record retrieved for editing');
    const { name, dob, email, phone } = patient;

    const nameField = document.getElementById('patient-name');
    const dobField = document.getElementById('patient-dob');
    const emailField = document.getElementById('patient-email');
    const phoneField = document.getElementById('patient-phone');
    const idField = document.getElementById('patient-id');
    const submitBtn = document.getElementById('submit-btn');
    
    if (nameField) nameField.value = name;
    if (dobField) dobField.value = dob;
    if (emailField) emailField.value = email;
    if (phoneField) phoneField.value = phone || '';
    if (idField) idField.value = id;
    if (submitBtn) submitBtn.textContent = 'Update Patient';
    
    // Show modal if it exists
    try {
      const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
      modal.show();
      console.log('Modal shown for editing');
    } catch (error) {
      console.error('Error showing modal:', error);
    }
  } catch (error) {
    console.error('Edit fetch failed:', error);
    showToast('Failed to load patient for edit: ' + error.message, true);
  }
}

async function handleDeletePatient(id) {
  try {
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }
    
    await configureAmplify();
    console.log('Processing delete request');
    
    const client = AWS.Amplify.generateClient();
    const user = await AWS.Auth.getCurrentUser();
    const userId = user.username;
    
    // First verify this patient belongs to the current user
    const { data: existingPatient } = await client.models.Patient.get({ id });
    if (!existingPatient || existingPatient.createdBy !== userId) {
      console.error('Unauthorized patient deletion attempt');
      showToast('You are not authorized to delete this patient record.', true);
      return;
    }
    
    await client.models.Patient.delete({ id });
    
    // Log action without PHI for audit trail
    console.log('Patient record deleted successfully');
    
    showToast('Patient deleted successfully.');
    await listPatients();
  } catch (error) {
    console.error('Delete failed:', error);
    showToast('Failed to delete patient: ' + error.message, true);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing dashboard');
  loadDashboard();

  const form = document.getElementById('add-patient-form');
  if (form) {
    console.log('Add patient form found, adding submit listener');
    form.addEventListener('submit', handleAddPatient);
  } else {
    console.warn('Add patient form not found');
  }

  const searchBtn = document.getElementById('search-patient-btn');
  if (searchBtn) {
    console.log('Search button found, adding click listener');
    searchBtn.addEventListener('click', handleSearch);
  } else {
    console.warn('Search button not found');
  }

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    console.log('Logout link found, adding click listener');
    logoutLink.addEventListener('click', handleLogout);
  } else {
    console.warn('Logout link not found');
  }
  
  const addPatientBtn = document.getElementById('add-patient-btn');
  if (addPatientBtn) {
    console.log('Add patient button found, adding click listener');
    addPatientBtn.addEventListener('click', () => {
      try {
        // Reset form if it exists
        const form = document.getElementById('add-patient-form');
        if (form) form.reset();
        
        // Reset ID field
        const idField = document.getElementById('patient-id');
        if (idField) idField.value = '';
        
        // Reset submit button text
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.textContent = 'Add Patient';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
        modal.show();
      } catch (error) {
        console.error('Error showing add patient modal:', error);
      }
    });
  } else {
    console.warn('Add patient button not found');
  }
});

// Export functions for HTML access
export { handleAddPatient };
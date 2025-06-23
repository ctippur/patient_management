// dashboard.js - Using tokens from localStorage

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

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('accessToken');
  return !!token;
}

// Get current user info from localStorage
function getCurrentUser() {
  const token = localStorage.getItem('accessToken');
  const email = localStorage.getItem('userEmail');
  
  if (!token) {
    throw new Error("No authenticated user");
  }
  
  return {
    username: email || 'User',
    signInDetails: { loginId: email || 'user@example.com' }
  };
}

// Get patients from localStorage
function getPatients() {
  try {
    const patientsJson = localStorage.getItem('patients');
    return patientsJson ? JSON.parse(patientsJson) : [];
  } catch (error) {
    console.error('Error getting patients:', error);
    return [];
  }
}

// Get patient by ID
function getPatientById(id) {
  const patients = getPatients();
  return patients.find(patient => patient.id === id);
}

// Add this helper function to display patients
function displayPatients(patients) {
  const container = document.getElementById('patient-list');
  if (!container) return;
  
  if (patients.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No matching patients found.</div>';
    return;
  }
  
  // Display patients
  container.innerHTML = '';
  patients.forEach(patient => {
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
        <div class="mt-2">
          <a href="history.html?patientId=${patient.id}" class="btn btn-info btn-sm me-2">Patient History</a>
          <a href="clinical_eval.html?patientId=${patient.id}" class="btn btn-info btn-sm me-2">New Visit</a>
          <button class="btn btn-secondary btn-sm view-visits-btn" data-id="${patient.id}">View Past Visits</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  
  // Add event listeners for buttons
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => handleEditPatient(btn.dataset.id));
  });
  
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeletePatient(btn.dataset.id));
  });
  
  container.querySelectorAll('.view-visits-btn').forEach(btn => {
    btn.addEventListener('click', () => showPatientVisits(btn.dataset.id));
  });
}

function handleSearch() {
  const query = document.getElementById('search-query')?.value.toLowerCase() || '';
  if (!query) {
    loadDashboard(); // If search is empty, just reload all patients
    return;
  }
  
  try {
    // Get all patients
    const patients = getPatients();
    
    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => 
      patient.name.toLowerCase().includes(query) || 
      (patient.email && patient.email.toLowerCase().includes(query)) ||
      (patient.phone && patient.phone.toLowerCase().includes(query))
    );
    
    // Display filtered patients
    displayPatients(filteredPatients);
  } catch (error) {
    console.error('Error searching patients:', error);
    showToast('Failed to search patients: ' + error.message, true);
  }
}

// Initialize dashboard
async function loadDashboard() {
  try {
    if (!isAuthenticated()) {
      // Redirect to login page if not authenticated
      showToast('Please log in to access the dashboard', true);
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
      return;
    }
    
    try {
      const user = getCurrentUser();
      const greeting = document.getElementById('user-greeting');
      if (greeting) {
        greeting.textContent = `Welcome, ${user.signInDetails?.loginId || user.username}`;
      }
      
      // Get patients from localStorage
      const patients = getPatients();
      displayPatients(patients);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      showToast('Session expired. Please log in again.', true);
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }
  } catch (error) {
    console.error('Error in loadDashboard:', error);
    showToast('An error occurred. Please try again.', true);
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('userEmail');
  window.location.href = '/index.html';
}

// Add patient
async function addPatient(patientData) {
  try {
    const { name, dob, email, phone } = patientData;
    
    if (!name || !dob || !email) {
      showToast('Name, DOB, and Email are required.', true);
      return;
    }

    // Get existing patients
    const patients = getPatients();
    
    // Add new patient
    const newPatient = {
      id: 'patient-' + Date.now(),
      name,
      dob,
      email,
      phone,
      createdAt: new Date().toISOString()
    };
    
    patients.push(newPatient);
    
    // Save to localStorage
    localStorage.setItem('patients', JSON.stringify(patients));
    
    showToast('Patient added successfully!');
    
    // Reload the dashboard
    loadDashboard();
  } catch (error) {
    console.error('Error saving patient:', error);
    showToast('Failed to save patient: ' + error.message, true);
  }
}

// Form handler for submit event
async function handleAddPatient(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  
  console.log('Add patient form submitted');
  
  const name = document.getElementById('patient-name')?.value.trim();
  const dob = document.getElementById('patient-dob')?.value;
  const email = document.getElementById('patient-email')?.value.trim();
  const phone = document.getElementById('patient-phone')?.value.trim();
  const id = document.getElementById('patient-id')?.value;
  
  if (id) {
    // Update existing patient
    updatePatient({ id, name, dob, email, phone });
  } else {
    // Add new patient
    addPatient({ name, dob, email, phone });
  }
  
  const form = document.getElementById('add-patient-form');
  if (form) {
    form.reset();
  }
  
  // Close modal if it exists
  try {
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
    if (modal) {
      modal.hide();
    }
  } catch (error) {
    console.error('Error hiding modal:', error);
  }
}

// Update patient
function updatePatient(patientData) {
  try {
    const { id, name, dob, email, phone } = patientData;
    
    if (!id || !name || !dob || !email) {
      showToast('ID, Name, DOB, and Email are required.', true);
      return;
    }
    
    // Get existing patients
    const patients = getPatients();
    
    // Find and update the patient
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) {
      showToast('Patient not found.', true);
      return;
    }
    
    patients[index] = {
      ...patients[index],
      name,
      dob,
      email,
      phone,
      updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('patients', JSON.stringify(patients));
    
    showToast('Patient updated successfully!');
    
    // Reload the dashboard
    loadDashboard();
  } catch (error) {
    console.error('Error updating patient:', error);
    showToast('Failed to update patient: ' + error.message, true);
  }
}

// Handle edit patient
function handleEditPatient(id) {
  try {
    const patient = getPatientById(id);
    if (!patient) {
      showToast('Patient not found.', true);
      return;
    }
    
    // Fill the form with patient data
    const nameField = document.getElementById('patient-name');
    const dobField = document.getElementById('patient-dob');
    const emailField = document.getElementById('patient-email');
    const phoneField = document.getElementById('patient-phone');
    const idField = document.getElementById('patient-id');
    const submitBtn = document.getElementById('submit-btn');
    
    if (nameField) nameField.value = patient.name;
    if (dobField) dobField.value = patient.dob;
    if (emailField) emailField.value = patient.email;
    if (phoneField) phoneField.value = patient.phone || '';
    if (idField) idField.value = patient.id;
    if (submitBtn) submitBtn.textContent = 'Update Patient';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
  } catch (error) {
    console.error('Error editing patient:', error);
    showToast('Failed to edit patient: ' + error.message, true);
  }
}

// Handle delete patient
function handleDeletePatient(id) {
  try {
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }
    
    // Get existing patients
    const patients = getPatients();
    
    // Find and remove the patient
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) {
      showToast('Patient not found.', true);
      return;
    }
    
    patients.splice(index, 1);
    
    // Save to localStorage
    localStorage.setItem('patients', JSON.stringify(patients));
    
    showToast('Patient deleted successfully!');
    
    // Reload the dashboard
    loadDashboard();
  } catch (error) {
    console.error('Error deleting patient:', error);
    showToast('Failed to delete patient: ' + error.message, true);
  }
}

// Show patient visits
function showPatientVisits(patientId) {
  try {
    // Get the patient's visits from localStorage
    const visits = getPatientVisits(patientId);
    const patient = getPatientById(patientId);
    
    if (!patient) {
      showToast('Patient not found.', true);
      return;
    }
    
    // Create a modal to display the visits
    const modalHtml = `
      <div class="modal fade" id="visitsModal" tabindex="-1" aria-labelledby="visitsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="visitsModalLabel">Past Visits - ${patient.name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${visits.length === 0 ? 
                '<div class="alert alert-info">No past visits found.</div>' : 
                `<div class="list-group">
                  ${visits.map(visit => `
                    <a href="clinical_eval.html?patientId=${patientId}&visitId=${visit.id}" class="list-group-item list-group-item-action">
                      <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">Visit on ${new Date(visit.date).toLocaleDateString()}</h5>
                        <span class="badge ${visit.diagnosis ? 'bg-success' : 'bg-warning'}">${visit.diagnosis ? 'Diagnosis Available' : 'No Diagnosis'}</span>
                      </div>
                      <p class="mb-1">${visit.clinicalExam?.summary || 'No summary available'}</p>
                      ${visit.diagnosis ? `<div class="mt-2 p-2 bg-light"><strong>Diagnosis:</strong> ${visit.diagnosis.substring(0, 100)}...</div>` : ''}
                    </a>
                  `).join('')}
                </div>`
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('visitsModal'));
    modal.show();
    
    // Remove the modal from the DOM when it's hidden
    document.getElementById('visitsModal').addEventListener('hidden.bs.modal', function () {
      document.body.removeChild(modalContainer);
    });
  } catch (error) {
    console.error('Error showing patient visits:', error);
    showToast('Failed to show patient visits: ' + error.message, true);
  }
}

// Get patient visits
function getPatientVisits(patientId) {
  try {
    const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
    return visitsJson ? JSON.parse(visitsJson) : [];
  } catch (error) {
    console.error('Error getting patient visits:', error);
    return [];
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing dashboard');
  loadDashboard();

  const form = document.getElementById('add-patient-form');
  if (form) {
    form.addEventListener('submit', handleAddPatient);
  }

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', handleLogout);
  }
  
  const addPatientBtn = document.getElementById('add-patient-btn');
  if (addPatientBtn) {
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

    const searchBtn = document.getElementById('search-patient-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', handleSearch);
    }
  }
  
  // Also add this for search on Enter key
  const searchInput = document.getElementById('search-query');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
});
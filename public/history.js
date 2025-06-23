// history.js - Patient history functionality

// API configuration
const API_BASE_URL = 'https://dyzife14sc.execute-api.us-east-1.amazonaws.com/dev';

// Get URL parameters
function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  
  return params;
}

// Show toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('app-toast');
  if (!toast) {
    console.warn('Toast element not found');
    alert(message);
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
    alert(message);
  }
}

// Get patient by ID
async function getPatientById(id) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/patient/${id}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const patientsJson = localStorage.getItem('patients');
      if (!patientsJson) {
        throw new Error('No patients found in localStorage');
      }
      
      const patients = JSON.parse(patientsJson);
      const patient = patients.find(p => p.id === id);
      
      if (!patient) {
        throw new Error('Patient not found in localStorage');
      }
      
      return patient;
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
}

// Get patient visits
async function getPatientVisits(patientId) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/patient-visits/${patientId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
      return visitsJson ? JSON.parse(visitsJson) : [];
    }
  } catch (error) {
    console.error('Error getting patient visits:', error);
    return [];
  }
}

// Update patient history
async function updatePatientHistory(patientId, historyData) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/patient/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: historyData
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const patientsJson = localStorage.getItem('patients');
      if (!patientsJson) {
        throw new Error('No patients found in localStorage');
      }
      
      const patients = JSON.parse(patientsJson);
      const index = patients.findIndex(p => p.id === patientId);
      
      if (index === -1) {
        throw new Error('Patient not found in localStorage');
      }
      
      // Update patient history
      patients[index] = {
        ...patients[index],
        history: historyData,
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('patients', JSON.stringify(patients));
      
      return patients[index];
    }
  } catch (error) {
    console.error('Error updating patient history:', error);
    throw error;
  }
}

// Initialize page
async function initializePage() {
  try {
    const params = getUrlParams();
    const patientId = params.patientId;
    
    if (!patientId) {
      showToast('Patient ID is required', true);
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
      return;
    }
    
    // Get patient information
    const patient = await getPatientById(patientId);
    
    // Update patient info section
    const patientInfoElement = document.getElementById('patient-info');
    if (patientInfoElement) {
      patientInfoElement.innerHTML = `
        <h4>${patient.name}</h4>
        <p>DOB: ${patient.dob}</p>
        <p>Email: ${patient.email}</p>
        <p>Phone: ${patient.phone || 'N/A'}</p>
      `;
    }
    
    // Fill history form if available
    if (patient.history) {
      const medicalHistoryField = document.getElementById('medical-history');
      const familyHistoryField = document.getElementById('family-history');
      const allergiesField = document.getElementById('allergies');
      const medicationsField = document.getElementById('medications');
      
      if (medicalHistoryField) medicalHistoryField.value = patient.history.medicalHistory || '';
      if (familyHistoryField) familyHistoryField.value = patient.history.familyHistory || '';
      if (allergiesField) allergiesField.value = patient.history.allergies || '';
      if (medicationsField) medicationsField.value = patient.history.medications || '';
    }
    
    // Get patient visits
    const visits = await getPatientVisits(patientId);
    
    // Display visits timeline
    const timelineElement = document.getElementById('visits-timeline');
    if (timelineElement) {
      if (visits.length === 0) {
        timelineElement.innerHTML = '<div class="alert alert-info">No visits recorded yet.</div>';
      } else {
        const timelineHtml = visits.map(visit => `
          <div class="timeline-item">
            <div class="timeline-date">${new Date(visit.date || visit.createdAt).toLocaleDateString()}</div>
            <div class="timeline-content">
              <h5>Clinical Exam</h5>
              <p>${visit.clinicalExam?.summary || 'No summary available'}</p>
              ${visit.diagnosis ? `
                <div class="mt-2">
                  <h5>Diagnosis</h5>
                  <p>${visit.diagnosis}</p>
                </div>
              ` : ''}
              <a href="/clinical_eval.html?patientId=${patientId}&visitId=${visit.id}" class="btn btn-sm btn-info mt-2">View Details</a>
            </div>
          </div>
        `).join('');
        
        timelineElement.innerHTML = timelineHtml;
      }
    }
    
    // Set up form submission handler
    const historyForm = document.getElementById('history-form');
    if (historyForm) {
      historyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const historyData = {
          medicalHistory: document.getElementById('medical-history').value,
          familyHistory: document.getElementById('family-history').value,
          allergies: document.getElementById('allergies').value,
          medications: document.getElementById('medications').value
        };
        
        try {
          await updatePatientHistory(patientId, historyData);
          showToast('Patient history updated successfully!');
        } catch (error) {
          console.error('Error saving patient history:', error);
          showToast('Failed to save patient history: ' + error.message, true);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing page:', error);
    showToast('Error initializing page: ' + error.message, true);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializePage().catch(error => {
    console.error('Error initializing page:', error);
    showToast('Error initializing page: ' + error.message, true);
  });
});
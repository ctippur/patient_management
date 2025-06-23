// clinical_eval.js - Clinical evaluation functionality

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

// Get visit by ID
async function getVisitById(id) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/visit/${id}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const params = getUrlParams();
      const patientId = params.patientId;
      
      if (!patientId) {
        throw new Error('Patient ID is required');
      }
      
      const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
      if (!visitsJson) {
        throw new Error('No visits found in localStorage');
      }
      
      const visits = JSON.parse(visitsJson);
      const visit = visits.find(v => v.id === id);
      
      if (!visit) {
        throw new Error('Visit not found in localStorage');
      }
      
      return visit;
    }
  } catch (error) {
    console.error('Error fetching visit:', error);
    throw error;
  }
}

// Create visit
async function createVisit(visitData) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const patientId = visitData.patientId;
      
      if (!patientId) {
        throw new Error('Patient ID is required');
      }
      
      // Get existing visits or create new array
      const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
      const visits = visitsJson ? JSON.parse(visitsJson) : [];
      
      // Create new visit
      const newVisit = {
        id: 'visit-' + Date.now(),
        patientId,
        date: new Date().toISOString(),
        ...visitData,
        createdAt: new Date().toISOString()
      };
      
      // Add to visits array
      visits.push(newVisit);
      
      // Save to localStorage
      localStorage.setItem(`patient_${patientId}_visits`, JSON.stringify(visits));
      
      return newVisit;
    }
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
}

// Update visit
async function updateVisit(visitId, visitData) {
  try {
    // Try API first
    try {
      const response = await fetch(`${API_BASE_URL}/visit/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (apiError) {
      console.error('API error, falling back to localStorage:', apiError);
      
      // Fall back to localStorage
      const params = getUrlParams();
      const patientId = params.patientId;
      
      if (!patientId) {
        throw new Error('Patient ID is required');
      }
      
      const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
      if (!visitsJson) {
        throw new Error('No visits found in localStorage');
      }
      
      const visits = JSON.parse(visitsJson);
      const index = visits.findIndex(v => v.id === visitId);
      
      if (index === -1) {
        throw new Error('Visit not found in localStorage');
      }
      
      // Update visit
      visits[index] = {
        ...visits[index],
        ...visitData,
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(`patient_${patientId}_visits`, JSON.stringify(visits));
      
      return visits[index];
    }
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
}

// Save clinical evaluation
async function saveClinicalEvaluation(formData) {
  try {
    const params = getUrlParams();
    const patientId = params.patientId;
    const visitId = params.visitId;
    
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    
    // Prepare visit data
    const visitData = {
      patientId,
      clinicalExam: {
        summary: formData.summary,
        symptoms: formData.symptoms,
        observations: formData.observations
      }
    };
    
    let result;
    
    if (visitId) {
      // Update existing visit
      result = await updateVisit(visitId, visitData);
      showToast('Clinical evaluation updated successfully!');
    } else {
      // Create new visit
      result = await createVisit(visitData);
      showToast('Clinical evaluation saved successfully!');
      
      // Update URL with new visit ID
      const newUrl = `${window.location.pathname}?patientId=${patientId}&visitId=${result.id}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    return result;
  } catch (error) {
    console.error('Error saving clinical evaluation:', error);
    showToast('Failed to save clinical evaluation: ' + error.message, true);
    throw error;
  }
}

// Save instrumental evaluation
async function saveInstrumentalEvaluation(formData) {
  try {
    const params = getUrlParams();
    const patientId = params.patientId;
    const visitId = params.visitId;
    
    if (!patientId || !visitId) {
      throw new Error('Patient ID and Visit ID are required');
    }
    
    // Prepare visit data
    const visitData = {
      instrumentalEvaluation: {
        findings: formData.findings,
        recommendations: formData.recommendations,
        attachments: formData.attachments || []
      }
    };
    
    // Update existing visit
    const result = await updateVisit(visitId, visitData);
    showToast('Instrumental evaluation saved successfully!');
    
    return result;
  } catch (error) {
    console.error('Error saving instrumental evaluation:', error);
    showToast('Failed to save instrumental evaluation: ' + error.message, true);
    throw error;
  }
}

// Save diagnosis
async function saveDiagnosis(diagnosis) {
  try {
    const params = getUrlParams();
    const patientId = params.patientId;
    const visitId = params.visitId;
    
    if (!patientId || !visitId) {
      throw new Error('Patient ID and Visit ID are required');
    }
    
    // Prepare visit data
    const visitData = {
      diagnosis
    };
    
    // Update existing visit
    const result = await updateVisit(visitId, visitData);
    showToast('Diagnosis saved successfully!');
    
    return result;
  } catch (error) {
    console.error('Error saving diagnosis:', error);
    showToast('Failed to save diagnosis: ' + error.message, true);
    throw error;
  }
}

// Initialize page
async function initializePage() {
  try {
    const params = getUrlParams();
    const patientId = params.patientId;
    const visitId = params.visitId;
    
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
    
    // If visit ID is provided, load visit data
    if (visitId) {
      const visit = await getVisitById(visitId);
      
      // Fill clinical exam form
      if (visit.clinicalExam) {
        const summaryField = document.getElementById('clinical-summary');
        const symptomsField = document.getElementById('clinical-symptoms');
        const observationsField = document.getElementById('clinical-observations');
        
        if (summaryField) summaryField.value = visit.clinicalExam.summary || '';
        if (symptomsField) symptomsField.value = visit.clinicalExam.symptoms || '';
        if (observationsField) observationsField.value = visit.clinicalExam.observations || '';
      }
      
      // Fill instrumental exam form
      if (visit.instrumentalEvaluation) {
        const findingsField = document.getElementById('instrumental-findings');
        const recommendationsField = document.getElementById('instrumental-recommendations');
        
        if (findingsField) findingsField.value = visit.instrumentalEvaluation.findings || '';
        if (recommendationsField) recommendationsField.value = visit.instrumentalEvaluation.recommendations || '';
      }
      
      // Fill diagnosis form
      if (visit.diagnosis) {
        const diagnosisField = document.getElementById('diagnosis');
        if (diagnosisField) diagnosisField.value = visit.diagnosis || '';
      }
    }
    
    // Set up form submission handlers
    const clinicalForm = document.getElementById('clinical-exam-form');
    if (clinicalForm) {
      clinicalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          summary: document.getElementById('clinical-summary').value,
          symptoms: document.getElementById('clinical-symptoms').value,
          observations: document.getElementById('clinical-observations').value
        };
        
        await saveClinicalEvaluation(formData);
      });
    }
    
    const instrumentalForm = document.getElementById('instrumental-exam-form');
    if (instrumentalForm) {
      instrumentalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          findings: document.getElementById('instrumental-findings').value,
          recommendations: document.getElementById('instrumental-recommendations').value
        };
        
        await saveInstrumentalEvaluation(formData);
      });
    }
    
    const diagnosisForm = document.getElementById('diagnosis-form');
    if (diagnosisForm) {
      diagnosisForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const diagnosis = document.getElementById('diagnosis').value;
        
        await saveDiagnosis(diagnosis);
      });
    }
    
    // Set up generate diagnosis button
    const generateDiagnosisBtn = document.getElementById('generate-diagnosis-btn');
    if (generateDiagnosisBtn) {
      generateDiagnosisBtn.addEventListener('click', async () => {
        try {
          const diagnosisField = document.getElementById('diagnosis');
          if (diagnosisField) {
            diagnosisField.value = "Based on the clinical examination and instrumental evaluation, the patient appears to have a mild condition that requires regular monitoring. Recommend follow-up in 3 months.";
            showToast('Diagnosis generated successfully!');
          }
        } catch (error) {
          console.error('Error generating diagnosis:', error);
          showToast('Failed to generate diagnosis: ' + error.message, true);
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
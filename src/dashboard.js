// src/dashboard.js
import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  getCurrentUser,
  signOut
} from 'aws-amplify/auth';
import {
  generateClient
} from 'aws-amplify/data';
import { Schema } from '../amplify/data/resource';
import config from '../amplify_outputs.json';

// Configure Amplify
Amplify.configure(config);

// Create client with the schema
const client = generateClient();

// Toast display utility
function showToast(message, isError = false) {
  const toast = document.getElementById('app-toast');
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }
  const toastBody = toast.querySelector('.toast-body');
  if (toastBody) {
    toastBody.textContent = message;
  }
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

async function loadDashboard() {
  try {
    const user = await getCurrentUser();
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
    const user = await getCurrentUser();
    const userId = user.username;

    const { data: patients, errors } = await client.models.Patient.list();
    
    if (errors) {
      console.error('Errors fetching patients:', errors);
      showToast('Error loading patients.', true);
      return;
    }
    
    const container = document.getElementById('patient-list');
    if (!container) return;
    
    container.innerHTML = '';

    (patients || [])
      .filter(patient => patient.owner === userId)
      .forEach(patient => {
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
    showToast('Error loading patients.', true);
  }
}

// Function for direct calls from HTML
export async function addPatient(patientData) {
  try {
    const { name, dob, email, phone, id } = patientData;
    
    if (!name || !dob || !email) {
      showToast('Name, DOB, and Email are required.', true);
      return;
    }

    const user = await getCurrentUser();
    const owner = user.username;

    if (id) {
      const { errors } = await client.models.Patient.update({
        id,
        name,
        dob,
        email,
        phone,
        owner
      });
      
      if (errors) {
        console.error('Errors updating patient:', errors);
        showToast('Failed to update patient.', true);
        return;
      }
      
      showToast('Patient updated successfully!');
    } else {
      const { errors } = await client.models.Patient.create({
        name,
        dob,
        email,
        phone,
        owner
      });
      
      if (errors) {
        console.error('Errors creating patient:', errors);
        showToast('Failed to create patient.', true);
        return;
      }
      
      showToast('Patient added successfully!');
    }
    
    await listPatients();
  } catch (error) {
    console.error('Error saving patient:', error);
    showToast('Failed to save patient.', true);
  }
}

// Form handler for submit event
async function handleAddPatient(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  
  const name = document.getElementById('patient-name')?.value.trim();
  const dob = document.getElementById('patient-dob')?.value;
  const email = document.getElementById('patient-email')?.value.trim();
  const phone = document.getElementById('patient-phone')?.value.trim();
  const id = document.getElementById('patient-id')?.value;

  await addPatient({ name, dob, email, phone, id });
  
  const form = document.getElementById('add-patient-form');
  if (form) form.reset();
  
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.textContent = 'Add Patient';
}

async function handleSearch() {
  const query = document.getElementById('search-query')?.value.toLowerCase() || '';
  try {
    const { data: patients, errors } = await client.models.Patient.list();
    
    if (errors) {
      console.error('Errors searching patients:', errors);
      showToast('Error searching patients.', true);
      return;
    }
    
    const container = document.getElementById('patient-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filtered = (patients || []).filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.email && p.email.toLowerCase().includes(query))
    );
    
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
    showToast('Failed to search patients.', true);
  }
}

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Failed to logout.', true);
  }
}

async function handleEditPatient(id) {
  try {
    const { data: patient, errors } = await client.models.Patient.get({ id });
    
    if (errors) {
      console.error('Errors fetching patient:', errors);
      showToast('Failed to load patient for edit.', true);
      return;
    }
    
    if (!patient) {
      showToast('Patient not found.', true);
      return;
    }

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
  } catch (error) {
    console.error('Edit fetch failed:', error);
    showToast('Failed to load patient for edit.', true);
  }
}

async function handleDeletePatient(id) {
  try {
    const { errors } = await client.models.Patient.delete({ id });
    
    if (errors) {
      console.error('Errors deleting patient:', errors);
      showToast('Failed to delete patient.', true);
      return;
    }
    
    showToast('Patient deleted successfully.');
    await listPatients();
  } catch (error) {
    console.error('Delete failed:', error);
    showToast('Failed to delete patient.', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();

  const form = document.getElementById('add-patient-form');
  if (form) {
    form.addEventListener('submit', handleAddPatient);
  }

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', handleLogout);
  }
});
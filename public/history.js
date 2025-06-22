// history.js
// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('patientId');
let historyResponses = {};

// Decision tree for dizzy patient history
const decisionTree = {
  start: {
    question: "How would you describe the patient's dizziness?",
    options: [
      { text: "Spinning (Vertigo)", next: "durationVertigo" },
      { text: "Light-headed / Fainting sensation", next: "faintingTriggers" },
      { text: "Unsteadiness / Imbalance", next: "imbalanceDuration" },
      { text: "Floating / Disconnected feeling", next: "pppdAssessment" }
    ],
    skip: "onsetType"
  },
  // Add these missing nodes
  faintingTriggers: {
    question: "Are there specific triggers for the light-headedness/fainting?",
    options: [
      { text: "Standing up quickly", next: "onsetType" },
      { text: "After exercise", next: "onsetType" },
      { text: "When anxious", next: "onsetType" },
      { text: "No clear trigger", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  
  imbalanceDuration: {
    question: "How long has the imbalance been present?",
    options: [
      { text: "Days", next: "onsetType" },
      { text: "Weeks", next: "onsetType" },
      { text: "Months", next: "onsetType" },
      { text: "Years", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  
  pppdAssessment: {
    question: "Is the floating/disconnected feeling constant?",
    options: [
      { text: "Yes, all the time", next: "onsetType" },
      { text: "No, it comes and goes", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  
  triggerSeconds: {
    question: "What triggers these brief episodes?",
    options: [
      { text: "Head position changes", next: "onsetType" },
      { text: "Rolling over in bed", next: "onsetType" },
      { text: "Looking up/down", next: "onsetType" },
      { text: "No clear trigger", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  
  triggerMinutes: {
    question: "Are these longer episodes associated with any of these?",
    options: [
      { text: "Hearing changes", next: "onsetType" },
      { text: "Pressure in ear", next: "onsetType" },
      { text: "Headache", next: "onsetType" },
      { text: "None of these", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  
  continuousDuration: {
    question: "How long has the continuous dizziness been present?",
    options: [
      { text: "Days", next: "onsetType" },
      { text: "Weeks", next: "onsetType" },
      { text: "Months", next: "onsetType" },
      { text: "Years", next: "onsetType" }
    ],
    skip: "onsetType"
  },
  durationVertigo: {
    question: "What is the typical duration of dizziness episodes?",
    options: [
      { text: "Seconds", next: "triggerSeconds" },
      { text: "Minutes to hours", next: "triggerMinutes" },
      { text: "All day or constant", next: "continuousDuration" }
    ],
    skip: "onsetType"
  },
  onsetType: {
    question: "How did the dizziness start?",
    options: [
      { text: "Suddenly", next: "frequency" },
      { text: "Gradually", next: "frequency" },
      { text: "After infection", next: "frequency" },
      { text: "After trauma", next: "frequency" },
      { text: "Unknown", next: "frequency" }
    ],
    skip: "frequency"
  },
  frequency: {
    question: "How often do symptoms occur?",
    options: [
      { text: "Single episode", next: "visualSymptoms" },
      { text: "1–2/month", next: "visualSymptoms" },
      { text: "1–2/week", next: "visualSymptoms" },
      { text: "Daily", next: "visualSymptoms" },
      { text: "Constant", next: "visualSymptoms" }
    ],
    skip: "visualSymptoms"
  },
  visualSymptoms: {
    question: "Are there any visual-vestibular symptoms?",
    options: [
      { text: "Visual motion sensitivity", next: "autonomicSymptoms" },
      { text: "Oscillopsia", next: "autonomicSymptoms" },
      { text: "Difficulty focusing", next: "autonomicSymptoms" },
      { text: "None", next: "autonomicSymptoms" }
    ],
    skip: "autonomicSymptoms"
  },
  autonomicSymptoms: {
    question: "Are there any autonomic symptoms?",
    options: [
      { text: "Sweating", next: "associatedSymptoms" },
      { text: "Palpitations", next: "associatedSymptoms" },
      { text: "Anxiety", next: "associatedSymptoms" },
      { text: "Breathlessness", next: "associatedSymptoms" },
      { text: "None", next: "associatedSymptoms" }
    ],
    skip: "associatedSymptoms"
  },
  associatedSymptoms: {
    question: "Are there any other associated symptoms?",
    options: [
      { text: "Hearing loss", next: "triggers" },
      { text: "Tinnitus", next: "triggers" },
      { text: "Ear fullness", next: "triggers" },
      { text: "Nausea/Vomiting", next: "triggers" },
      { text: "Headache", next: "triggers" },
      { text: "None", next: "triggers" }
    ],
    skip: "triggers"
  },
  triggers: {
    question: "Are there any specific triggers for dizziness?",
    options: [
      { text: "Head movement", next: "additionalHistory" },
      { text: "Stress", next: "additionalHistory" },
      { text: "Visual motion", next: "additionalHistory" },
      { text: "Loud noise", next: "additionalHistory" },
      { text: "Pressure changes", next: "additionalHistory" },
      { text: "None", next: "additionalHistory" }
    ],
    skip: "additionalHistory"
  },
  additionalHistory: {
    question: "Are there any other symptoms, history, or observations not covered above?",
    options: [
      { text: "Enter below:", next: "end" }
    ],
    input: true,
    skip: "end"
  },
  end: {
    question: "Thank you. All responses have been recorded.",
    options: []
  }
};

// Initialize
async function init() {
  try {
    // Load patient info
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const patient = patients.find(p => p.id === patientId);
    
    if (patient) {
      document.getElementById('patient-name').textContent = `Patient History: ${patient.name}`;
      document.title = `History - ${patient.name}`;
    }
    
    // Set up save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', savePatientHistory);
    }
    
    // Load existing history or start new questionnaire
    const existingHistory = await loadPatientHistory();
    if (existingHistory) {
      historyResponses = existingHistory.responses || {};
      // If history exists but no responses, start questionnaire
      if (Object.keys(historyResponses).length === 0) {
        renderNode('start');
      } else {
        // Show summary of existing responses
        showHistorySummary(historyResponses);
      }
    } else {
      // Start new questionnaire
      renderNode('start');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize history form.', true);
  }
}

// Render a node in the decision tree
function renderNode(nodeKey) {
  const node = decisionTree[nodeKey];
  if (!node) {
    console.error('Node not found:', nodeKey);
    return;
  }
  
  const container = document.getElementById('history-container');
  if (!container) return;
  
  // Clear container and add question box
  container.innerHTML = `
    <div class="question-box">
      <div class="question">${node.question}</div>
      <div class="options" id="options"></div>
    </div>
  `;
  
  const optionsDiv = document.getElementById('options');
  
  // Add option buttons
  node.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary mb-2 w-100';
    btn.textContent = opt.text;
    btn.onclick = () => {
      // Save response
      historyResponses[node.question] = opt.text;
      renderNode(opt.next);
    };
    optionsDiv.appendChild(btn);
  });
  
  // Add input field if needed
  if (node.input) {
    const input = document.createElement('textarea');
    input.className = 'form-control mt-3';
    input.rows = 4;
    input.placeholder = "Enter additional details here...";
    input.onchange = (e) => {
      historyResponses[node.question + ' (notes)'] = e.target.value;
    };
    optionsDiv.appendChild(input);
  }
  
  // Add skip button if available
  if (node.skip) {
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-secondary mt-2 w-100';
    skipBtn.textContent = "Skip";
    skipBtn.onclick = () => renderNode(node.skip);
    optionsDiv.appendChild(skipBtn);
  }
  
  // Add save button at the end
  if (nodeKey === 'end') {
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success mt-3 w-100';
    saveBtn.textContent = "Save History";
    saveBtn.onclick = savePatientHistory;
    optionsDiv.appendChild(saveBtn);
  }
}

// Show summary of existing history
function showHistorySummary(responses) {
  const container = document.getElementById('history-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5>Patient History Summary</h5>
      </div>
      <div class="card-body">
        <div id="history-summary"></div>
        <div class="mt-3">
          <button id="edit-history-btn" class="btn btn-primary">Edit History</button>
          <button id="save-btn" class="btn btn-success ms-2">Save History</button>
        </div>
      </div>
    </div>
  `;
  
  const summaryDiv = document.getElementById('history-summary');
  
  // Display all responses
  Object.entries(responses).forEach(([question, answer]) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'mb-3';
    questionDiv.innerHTML = `
      <strong>${question}</strong>
      <p>${answer}</p>
    `;
    summaryDiv.appendChild(questionDiv);
  });
  
  // Add edit button listener
  document.getElementById('edit-history-btn').addEventListener('click', () => {
    renderNode('start');
  });
}

// Load patient history
async function loadPatientHistory() {
  try {
    // Try to load from Amplify backend first
    if (typeof aws_amplify_core !== 'undefined' && typeof aws_amplify_api !== 'undefined') {
      const { Amplify } = aws_amplify_core;
      const { generateClient } = aws_amplify_api;
      
      Amplify.configure({
        Auth: {
          region: "us-east-1",
          userPoolId: "us-east-1_jWed54fcK",
          userPoolWebClientId: "po58vsdfo8oklv3s5sadhe812"
        },
        API: {
          GraphQL: {
            endpoint: "https://t2hes6xt5nfjtk3slb24k7huta.appsync-api.us-east-1.amazonaws.com/graphql",
            region: "us-east-1",
            defaultAuthMode: "userPool"
          }
        }
      });
      
      const client = generateClient();
      
      const result = await client.graphql({
        query: `
          query GetPatientHistory($patientId: ID!) {
            listPatientHistories(filter: { patientId: { eq: $patientId } }) {
              items {
                id
                patientId
                responses
              }
            }
          }
        `,
        variables: { patientId }
      });
      
      const histories = result.data.listPatientHistories.items;
      
      if (histories && histories.length > 0) {
        const history = histories[0]; // Get the most recent one
        return {
          id: history.id,
          responses: JSON.parse(history.responses || '{}')
        };
      }
    }
    
    // Fallback to localStorage if Amplify failed or history not found
    return loadFromLocalStorage();
  } catch (error) {
    console.error('Error loading history:', error);
    showToast('Failed to load history from backend. Trying localStorage...', true);
    return loadFromLocalStorage();
  }
}

// Load from localStorage
function loadFromLocalStorage() {
  try {
    const historyJson = localStorage.getItem(`patient_${patientId}_history`);
    if (!historyJson) return null;
    
    const history = JSON.parse(historyJson);
    return {
      responses: history.responses || {}
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    showToast('Failed to load patient history.', true);
    return null;
  }
}

// Save patient history
async function savePatientHistory() {
  try {
    // Prepare history data
    const historyData = {
      patientId,
      responses: historyResponses
    };
    
    // Try to use Amplify backend first
    if (typeof aws_amplify_core !== 'undefined' && typeof aws_amplify_api !== 'undefined') {
      const { Amplify } = aws_amplify_core;
      const { generateClient } = aws_amplify_api;
      
      Amplify.configure({
        Auth: {
          region: "us-east-1",
          userPoolId: "us-east-1_jWed54fcK",
          userPoolWebClientId: "po58vsdfo8oklv3s5sadhe812"
        },
        API: {
          GraphQL: {
            endpoint: "https://t2hes6xt5nfjtk3slb24k7huta.appsync-api.us-east-1.amazonaws.com/graphql",
            region: "us-east-1",
            defaultAuthMode: "userPool"
          }
        }
      });
      
      const client = generateClient();
      
      // Check if history already exists
      const result = await client.graphql({
        query: `
          query GetPatientHistory($patientId: ID!) {
            listPatientHistories(filter: { patientId: { eq: $patientId } }) {
              items {
                id
              }
            }
          }
        `,
        variables: { patientId }
      });
      
      const histories = result.data.listPatientHistories.items;
      
      if (histories && histories.length > 0) {
        // Update existing history
        const historyId = histories[0].id;
        
        await client.graphql({
          query: `
            mutation UpdatePatientHistory($input: UpdatePatientHistoryInput!) {
              updatePatientHistory(input: $input) {
                id
                patientId
              }
            }
          `,
          variables: {
            input: {
              id: historyId,
              responses: JSON.stringify(historyResponses)
            }
          }
        });
      } else {
        // Create new history
        await client.graphql({
          query: `
            mutation CreatePatientHistory($input: CreatePatientHistoryInput!) {
              createPatientHistory(input: $input) {
                id
                patientId
              }
            }
          `,
          variables: {
            input: {
              patientId,
              responses: JSON.stringify(historyResponses)
            }
          }
        });
      }
      
      showToast('Patient history saved successfully!');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
      return;
    }
    
    // Fallback to localStorage if Amplify is not available
    saveToLocalStorage(historyData);
  } catch (error) {
    console.error('Error saving history:', error);
    showToast('Failed to save to backend. Using localStorage instead.', true);
    saveToLocalStorage({
      patientId,
      responses: historyResponses
    });
  }
}

// Save to localStorage
function saveToLocalStorage(historyData) {
  try {
    localStorage.setItem(`patient_${patientId}_history`, JSON.stringify(historyData));
    
    showToast('Patient history saved to localStorage successfully!');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    showToast('Failed to save patient history.', true);
  }
}

// Show toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.classList.toggle('bg-danger', isError);
  toast.classList.toggle('bg-primary', !isError);
  
  const toastBody = toast.querySelector('.toast-body');
  if (toastBody) toastBody.textContent = message;
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

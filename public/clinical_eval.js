// clinical_eval.js
let decisionTree = {};
let currentNode = 'start';
let examResults = {};
let uploadedFile = null;

// Get patient ID and visit ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('patientId');
const visitId = urlParams.get('visitId');

// Initialize
async function init() {
  try {
    // Load patient info
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const patient = patients.find(p => p.id === patientId);
    
    if (patient) {
      document.getElementById('patient-name').textContent = `Patient Visit: ${patient.name}`;
      document.title = `Visit - ${patient.name}`;
    }
    
    // Load decision tree for clinical exam
    await loadTree();
    
    // Set up file input listener
    document.getElementById('evaluation-file').addEventListener('change', handleFileSelect);
    
    // Set up save button
    document.getElementById('save-btn').addEventListener('click', saveVisit);
    
    // If visitId is provided, load that visit
    if (visitId) {
      loadExistingVisit(patientId, visitId);
    } else {
      // Otherwise, start a new visit
      document.title = `New Visit - Patient ${patientId}`;
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize visit form.', true);
  }
}

// Handle file selection
// Update the handleFileSelect function
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedFile = file;
    showToast(`File selected: ${file.name}`);
    checkDiagnosisReadiness(); // Check readiness after file selection
  }
}


// Load decision tree
async function loadTree() {
  try {
    const response = await fetch('/data/clinical_eval.csv');
    const csvText = await response.text();
    
    // Parse CSV to decision tree
    decisionTree = parseCsvToTree(csvText);
    renderNode(currentNode);
  } catch (error) {
    console.error('Error loading decision tree:', error);
    showToast('Failed to load examination questions.', true);
  }
}

// Add this function for printing the diagnosis
// Function to print diagnosis
function printDiagnosis() {
  const diagnosisContent = document.querySelector('.diagnosis-content').innerHTML;
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagnosis Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #333; }
        .header { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
        .content { margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Medical Diagnosis Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
      </div>
      <div class="content">
        ${diagnosisContent}
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}


// Add this function to clinical_eval.js
async function generateDiagnosis() {
  try {
    // Check if both clinical exam and instrumental evaluation are complete
    if (Object.keys(examResults).length === 0) {
      showToast('Please complete the clinical examination first', true);
      return;
    }
    
    const evaluationNotes = document.getElementById('evaluation-notes').value;
    if (!uploadedFile && !evaluationNotes) {
      showToast('Please upload an instrumental evaluation file or add notes', true);
      return;
    }
    
    showToast('Generating diagnosis...');
    
    // Get patient history
    const patientHistory = await getPatientHistory(patientId);
    if (!patientHistory) {
      showToast('Patient history not found. Please complete patient history first.', true);
      return;
    }
    
    // Prepare data for diagnosis
    const diagnosisData = {
      patientId,
      visitId: visitId || `visit_${Date.now()}`,
      history: patientHistory,
      clinicalExam: {
        results: examResults,
        summary: generateSummary(examResults)
      },
      instrumentalEvaluation: {
        notes: evaluationNotes,
        fileName: uploadedFile ? uploadedFile.name : null
      }
    };
    
    // If we have a file and AWS is available, get a pre-signed URL
    let fileUrl = null;
    if (uploadedFile && typeof aws_amplify_storage !== 'undefined') {
      const { uploadData, getUrl } = aws_amplify_storage;
      
      // Upload file if not already uploaded
      if (!diagnosisData.instrumentalEvaluation.fileKey) {
        const fileKey = `patients/${patientId}/evaluations/${Date.now()}_${uploadedFile.name}`;
        
        await uploadData({
          key: fileKey,
          data: uploadedFile,
          options: {
            accessLevel: 'private',
            contentType: uploadedFile.type
          }
        });
        
        diagnosisData.instrumentalEvaluation.fileKey = fileKey;
      }
      
      // Get pre-signed URL for the file
      const urlResult = await getUrl({
        key: diagnosisData.instrumentalEvaluation.fileKey,
        options: {
          expiresIn: 3600 // 1 hour
        }
      });
      
      fileUrl = urlResult.url;
    }
    
    // Call AI service for diagnosis
    const aiResponse = await callAIService(diagnosisData, fileUrl);
    
    // Display diagnosis
    // Update the diagnosis display in generateDiagnosis function with feedback options
    document.getElementById('diagnosis-result').innerHTML = `
      <div class="card">
        <div class="card-header bg-success text-white">Diagnosis Report</div>
        <div class="card-body">
          <div class="diagnosis-content">${aiResponse.diagnosis.replace(/\n/g, '<br>')}</div>
          
          <div class="mt-4 border-top pt-3">
            <h5>Feedback for Training</h5>
            <p class="text-muted small">Please help us improve our diagnostic system by providing feedback.</p>
            
            <div class="form-group mb-3">
              <label class="form-label">Which diagnosis do you agree with?</label>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis1" value="1">
                <label class="form-check-label" for="diagnosis1">Diagnosis 1</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis2" value="2">
                <label class="form-check-label" for="diagnosis2">Diagnosis 2</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis3" value="3">
                <label class="form-check-label" for="diagnosis3">Diagnosis 3</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosisNone" value="none">
                <label class="form-check-label" for="diagnosisNone">None of the above</label>
              </div>
            </div>
            
            <div class="form-group mb-3" id="alternative-diagnosis-container" style="display: none;">
              <label for="alternative-diagnosis" class="form-label">What is your diagnosis?</label>
              <textarea class="form-control" id="alternative-diagnosis" rows="3" placeholder="Please enter your diagnosis..."></textarea>
            </div>
            
            <button class="btn btn-primary" onclick="submitDiagnosisFeedback()">Submit Feedback</button>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="printDiagnosis()">Print Report</button>
        </div>
      </div>
    `;
    
    // Save diagnosis to database
    await saveDiagnosis(diagnosisData.visitId, aiResponse.diagnosis);
    
    showToast('Diagnosis generated successfully!');
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    showToast('Failed to generate diagnosis: ' + error.message, true);
  }
}

// Function to get patient history
async function getPatientHistory(patientId) {
  try {
    // Try to get from Amplify backend
    if (typeof aws_amplify_api !== 'undefined') {
      const { generateClient } = aws_amplify_api;
      const client = generateClient();
      
      const result = await client.graphql({
        query: `
          query GetPatientHistory($patientId: ID!) {
            listPatientHistories(filter: { patientId: { eq: $patientId } }) {
              items {
                responses
              }
            }
          }
        `,
        variables: { patientId }
      });
      
      const histories = result.data.listPatientHistories.items;
      if (histories && histories.length > 0) {
        return JSON.parse(histories[0].responses || '{}');
      }
    }
    
    // Fallback to localStorage
    const historyJson = localStorage.getItem(`patient_${patientId}_history`);
    if (historyJson) {
      const history = JSON.parse(historyJson);
      return history.responses || {};
    }
    
    return null;
  } catch (error) {
    console.error('Error getting patient history:', error);
    return null;
  }
}

// Function to call AI service (Bedrock or OpenAI)
async function callAIService1(diagnosisData, fileUrl) {
  // Create prompt for AI
  const prompt = `
    You are a clinical decision support assistant that helps clinicians evaluate dizzy patients. 
    You will be provided with structured data from the clinical examination, patient history, and vestibular testing. Based on this data, return the top 3 differential diagnoses with confidence scores and relevant treatment suggestions.

    
    PATIENT HISTORY:
    ${JSON.stringify(diagnosisData.history, null, 2)}
    
    CLINICAL EXAMINATION:
    ${JSON.stringify(diagnosisData.clinicalExam, null, 2)}
    
    INSTRUMENTAL EVALUATION:
    Notes: ${diagnosisData.instrumentalEvaluation.notes || 'None provided'}
    ${fileUrl ? `File: ${fileUrl}` : 'No file uploaded'}
    
    Based on the above information, provide a detailed diagnosis and treatment recommendations. Include patient name and date of birth to generate a professional looking report.
    Respond in the following format:

    ### Diagnostic Possibilities:
    1.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [Short reasoning based on the above findings]

    2.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [...]

    3.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [...]

    ### Suggested Management or Next Steps:
    •⁠  ⁠[Referral, confirmatory test, medication, or follow-up plan]
  `;
  console.log("prompt", prompt);
  try {
    // Prepare request body
    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a medical diagnostic assistant specializing in vestibular disorders.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    };
    
    // Use the API client to make the call (works in both local and AWS environments)
    const data = await ApiClient.callOpenAI(requestBody);
    
    return {
      diagnosis: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error('Failed to generate diagnosis');
  }
}

// Function to save diagnosis
async function saveDiagnosis(visitId, diagnosis) {
  try {
    // Try to save to Amplify backend
    if (typeof aws_amplify_api !== 'undefined') {
      const { generateClient } = aws_amplify_api;
      const client = generateClient();
      
      await client.graphql({
        query: `
          mutation UpdateVisit($input: UpdateVisitInput!) {
            updateVisit(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            id: visitId,
            diagnosis,
            diagnosisStatus: 'completed'
          }
        }
      });
      
      return;
    }
    
    // Fallback to localStorage
    const visitsJson = localStorage.getItem(`patient_${patientId}_visits`);
    if (visitsJson) {
      const visits = JSON.parse(visitsJson);
      const visitIndex = visits.findIndex(v => v.id === visitId);
      
      if (visitIndex !== -1) {
        visits[visitIndex].diagnosis = diagnosis;
        visits[visitIndex].diagnosisStatus = 'completed';
        localStorage.setItem(`patient_${patientId}_visits`, JSON.stringify(visits));
      }
    }
  } catch (error) {
    console.error('Error saving diagnosis:', error);
    throw new Error('Failed to save diagnosis');
  }
}



// Parse CSV to decision tree
function parseCsvToTree(csvText) {
  const lines = csvText.split('\n');
  const tree = {};
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split the CSV line but handle quoted values properly
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map(val => val.replace(/^"|"$/g, '').trim());
    
    const id = cleanValues[0];
    const question = cleanValues[1];
    
    // Special handling for additionalNotes node
    if (id === 'additionalNotes') {
      tree[id] = {
        question,
        options: [],
        input: false, // We'll handle this specially in renderNode
        skip: null,
        isTextArea: true
      };
      continue;
    }
    
    // Regular node processing
    const options = [];
    
    // Process options and next nodes
    for (let j = 2; j < cleanValues.length; j += 2) {
      const optionText = cleanValues[j];
      const nextNode = cleanValues[j + 1];
      
      if (optionText && nextNode) {
        options.push({
          text: optionText,
          next: nextNode
        });
      }
    }
    
    // Find skip_to value if present
    const skipToIndex = 8; // Based on the CSV structure
    const skipTo = cleanValues[skipToIndex] || null;
    
    tree[id] = {
      question,
      options,
      input: false,
      skip: skipTo
    };
  }
  
  return tree;
}


// Render a node
function renderNode(nodeKey) {
  const node = decisionTree[nodeKey];
  if (!node) {
    console.error('Node not found:', nodeKey);
    return;
  }
  
  currentNode = nodeKey;
  const questionBox = document.getElementById('question');
  const optionsBox = document.getElementById('options');

  questionBox.textContent = node.question;
  optionsBox.innerHTML = '';

  // Special handling for "Any other clinical signs" node
  if (nodeKey === 'additionalNotes') {
    // Create a text field for additional notes
    const input = document.createElement('textarea');
    input.className = 'input-box';
    input.placeholder = "Please enter any other clinical signs or observations...";
    input.rows = 4;
    input.onchange = (e) => {
      examResults[node.question] = e.target.value;
      checkDiagnosisReadiness();
    };
    optionsBox.appendChild(input);
    
    // Add a continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = "Continue";
    continueBtn.className = 'option-btn';
    continueBtn.style.marginTop = '10px';
    continueBtn.onclick = () => {
      renderNode('end');
      checkDiagnosisReadiness();
    };
    optionsBox.appendChild(continueBtn);
    
    return;
  }
  
  // Special handling for end node - don't show any buttons
  if (nodeKey === 'end') {
    questionBox.textContent = "Clinical examination complete.";
    return;
  }

  if (node.options && node.options.length > 0) {
    node.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.className = 'option-btn';
      btn.onclick = () => {
        // Save the answer
        examResults[node.question] = opt.text;
        renderNode(opt.next);
        checkDiagnosisReadiness();
      };
      optionsBox.appendChild(btn);
    });
  }

  if (node.input) {
    const input = document.createElement('textarea');
    input.className = 'input-box';
    input.placeholder = "Please enter additional clinical signs or notes...";
    input.onchange = (e) => {
      examResults[node.question + ' (notes)'] = e.target.value;
      checkDiagnosisReadiness();
    };
    optionsBox.appendChild(input);
  }

  if (node.skip) {
    const skip = document.createElement('button');
    skip.textContent = "Skip";
    skip.className = 'skip-btn';
    skip.onclick = () => renderNode(node.skip);
    optionsBox.appendChild(skip);
  }
}


// Save visit (both clinical exam and instrumental evaluation)
async function saveVisit() {
  try {
    // Get instrumental evaluation notes
    const evaluationNotes = document.getElementById('evaluation-notes').value;
    
    // Prepare visit data
    const visitData = {
      patientId,
      date: new Date().toISOString(),
      clinicalExam: {
        results: examResults,
        summary: generateSummary(examResults)
      },
      instrumentalEvaluation: {
        notes: evaluationNotes,
        fileKey: null // Will be set after upload
      }
    };
    
    // Try to use Amplify backend
    if (typeof aws_amplify_core !== 'undefined' && 
        typeof aws_amplify_api !== 'undefined' && 
        typeof aws_amplify_storage !== 'undefined') {
      
      const { Amplify } = aws_amplify_core;
      const { generateClient } = aws_amplify_api;
      const { uploadData } = aws_amplify_storage;
      
      // Configure Amplify
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
        },
        Storage: {
          AWSS3: {
            bucket: "patient-management-files",
            region: "us-east-1"
          }
        }
      });
      
      // Upload file if provided
      if (uploadedFile) {
        showToast('Uploading file...');
        
        // Create a unique file key with patient ID and timestamp
        const fileKey = `patients/${patientId}/evaluations/${Date.now()}_${uploadedFile.name}`;
        
        // Upload to S3 with private access level for HIPAA compliance
        const uploadResult = await uploadData({
          key: fileKey,
          data: uploadedFile,
          options: {
            accessLevel: 'private',
            contentType: uploadedFile.type,
            metadata: {
              patientId,
              visitId: visitId || `visit_${Date.now()}`,
              uploadDate: new Date().toISOString()
            }
          }
        });
        
        console.log('File uploaded successfully:', uploadResult);
        visitData.instrumentalEvaluation.fileKey = fileKey;
      }
      
      const client = generateClient();
      
      // Create or update visit
      if (visitId) {
        // Update existing visit
        const result = await client.graphql({
          query: `
            mutation UpdateVisit($input: UpdateVisitInput!) {
              updateVisit(input: $input) {
                id
                patientId
                date
              }
            }
          `,
          variables: {
            input: {
              id: visitId,
              ...visitData
            }
          }
        });
        
        console.log('Visit updated:', result);
      } else {
        // Create new visit
        const result = await client.graphql({
          query: `
            mutation CreateVisit($input: CreateVisitInput!) {
              createVisit(input: $input) {
                id
                patientId
                date
              }
            }
          `,
          variables: {
            input: visitData
          }
        });
        
        console.log('Visit created:', result);
      }
      
      // Update the saveVisit function to not redirect automatically
      // Remove these lines from saveVisit function
      showToast('Visit saved successfully!');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);

      // Replace with just a toast message
      showToast('Visit saved successfully!');

      return;
    }
    
    // Fallback to localStorage if Amplify is not available
    saveToLocalStorage(visitData);
  } catch (error) {
    console.error('Error saving visit:', error);
    showToast('Failed to save to backend. Using localStorage instead.', true);
    saveToLocalStorage({
      patientId,
      date: new Date().toISOString(),
      clinicalExam: {
        results: examResults,
        summary: generateSummary(examResults)
      },
      instrumentalEvaluation: {
        notes: document.getElementById('evaluation-notes').value,
        fileName: uploadedFile ? uploadedFile.name : null
      }
    });
  }
}


// Function to get a pre-signed URL for a file
async function getFileUrl(fileKey) {
  try {
    if (typeof aws_amplify_storage !== 'undefined') {
      const { getUrl } = aws_amplify_storage;
      
      // Get a pre-signed URL that expires in 15 minutes
      const result = await getUrl({
        key: fileKey,
        options: {
          expiresIn: 900 // 15 minutes in seconds
        }
      });
      
      return result.url;
    }
    return null;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}

// Function to get a pre-signed URL for a file
async function getFileUrl1(fileKey) {
  try {
    if (typeof aws_amplify_storage !== 'undefined') {
      const { getUrl } = aws_amplify_storage;
      
      // Get a pre-signed URL that expires in 15 minutes
      const result = await getUrl({
        key: fileKey,
        options: {
          expiresIn: 900 // 15 minutes in seconds
        }
      });
      
      return result.url;
    }
    return null;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}


// Function to send file to analysis API
async function sendFileToAnalysisApi(fileKey, patientId, visitId) {
  try {
    // Get a pre-signed URL for the file
    const fileUrl = await getFileUrl(fileKey);
    if (!fileUrl) {
      throw new Error('Could not generate URL for file');
    }
    
    // Send to your analysis API
    const response = await fetch('https://your-analysis-api.com/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileUrl,
        patientId,
        visitId,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending file to analysis API:', error);
    throw error;
  }
}



// Save to localStorage
function saveToLocalStorage(visitData) {
  try {
    // Get existing visits
    const visits = JSON.parse(localStorage.getItem(`patient_${patientId}_visits`) || '[]');
    
    // Create new visit or update existing
    const visit = {
      id: visitId || `visit_${Date.now()}`,
      ...visitData
    };
    
    // Add to visits or update existing
    if (visitId) {
      const index = visits.findIndex(v => v.id === visitId);
      if (index !== -1) {
        visits[index] = visit;
      } else {
        visits.push(visit);
      }
    } else {
      visits.push(visit);
    }
    
    // Save back to localStorage
    localStorage.setItem(`patient_${patientId}_visits`, JSON.stringify(visits));
    
    // Update the saveToLocalStorage function to not redirect automatically
    // Remove these lines from saveToLocalStorage function
    showToast('Visit saved to localStorage successfully!');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1500);

    // Replace with just a toast message
    showToast('Visit saved to localStorage successfully!');

  } catch (error) {
    console.error('Error saving to localStorage:', error);
    showToast('Failed to save visit.', true);
  }
}


// Load existing visit
async function loadExistingVisit(patientId, visitId) {
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
          query GetVisit($id: ID!) {
            getVisit(id: $id) {
              id
              patientId
              date
              clinicalExam
              instrumentalEvaluation
              diagnosis
            }
          }
        `,
        variables: { id: visitId }
      });
      
      const visit = result.data.getVisit;
      
      if (visit) {
        document.title = `Visit from ${new Date(visit.date).toLocaleDateString()}`;
        
        // Load clinical exam results
        examResults = JSON.parse(visit.clinicalExam.results);
        
        // Load instrumental evaluation notes
        document.getElementById('evaluation-notes').value = visit.instrumentalEvaluation?.notes || '';
        
        // Show file name if available
        if (visit.instrumentalEvaluation?.fileKey) {
          const fileName = visit.instrumentalEvaluation.fileKey.split('/').pop();
          showToast(`File already uploaded: ${fileName}`);
        }
        
        // Show diagnosis if available
        if (visit.diagnosis) {
          document.getElementById('diagnosis-result').innerHTML = `
            <div class="card">
              <div class="card-header bg-success text-white">Diagnosis Report</div>
              <div class="card-body">
                <div class="diagnosis-content">${visit.diagnosis.replace(/\n/g, '<br>')}</div>
                
                <div class="mt-4 border-top pt-3">
                  <h5>Feedback for Training</h5>
                  <p class="text-muted small">Please help us improve our diagnostic system by providing feedback.</p>
                  
                  <div class="form-group mb-3">
                    <label class="form-label">Which diagnosis do you agree with?</label>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis1" value="1">
                      <label class="form-check-label" for="diagnosis1">Diagnosis 1</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis2" value="2">
                      <label class="form-check-label" for="diagnosis2">Diagnosis 2</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis3" value="3">
                      <label class="form-check-label" for="diagnosis3">Diagnosis 3</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosisNone" value="none">
                      <label class="form-check-label" for="diagnosisNone">None of the above</label>
                    </div>
                  </div>
                  
                  <div class="form-group mb-3" id="alternative-diagnosis-container" style="display: none;">
                    <label for="alternative-diagnosis" class="form-label">What is your diagnosis?</label>
                    <textarea class="form-control" id="alternative-diagnosis" rows="3" placeholder="Please enter your diagnosis..."></textarea>
                  </div>
                  
                  <button class="btn btn-primary" onclick="submitDiagnosisFeedback()">Submit Feedback</button>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-sm btn-outline-primary" onclick="printDiagnosis()">Print Report</button>
              </div>
            </div>
          `;
        }
        
        return;
      }
    }
    
    // Fallback to localStorage if Amplify failed or visit not found
    loadFromLocalStorage();
    checkDiagnosisReadiness();
  } catch (error) {
    console.error('Error loading visit:', error);
    showToast('Failed to load visit from backend. Trying localStorage...', true);
    loadFromLocalStorage();
    checkDiagnosisReadiness();
  }
}


// Load from localStorage
function loadFromLocalStorage() {
  try {
    const visits = JSON.parse(localStorage.getItem(`patient_${patientId}_visits`) || '[]');
    const visit = visits.find(v => v.id === visitId);
    
    if (visit) {
      document.title = `Visit from ${new Date(visit.date).toLocaleDateString()}`;
      
      // Load clinical exam results
      examResults = visit.clinicalExam.results;
      
      // Load instrumental evaluation notes
      document.getElementById('evaluation-notes').value = visit.instrumentalEvaluation?.notes || '';
      
      // Show file name if available
      if (visit.instrumentalEvaluation?.fileName) {
        showToast(`File previously uploaded: ${visit.instrumentalEvaluation.fileName}`);
      }
      
      // Show diagnosis if available
      if (visit.diagnosis) {
        document.getElementById('diagnosis-result').innerHTML = `
          <div class="card">
            <div class="card-header bg-success text-white">Diagnosis Report</div>
            <div class="card-body">
              <div class="diagnosis-content">${visit.diagnosis.replace(/\n/g, '<br>')}</div>
              
              <div class="mt-4 border-top pt-3">
                <h5>Feedback for Training</h5>
                <p class="text-muted small">Please help us improve our diagnostic system by providing feedback.</p>
                
                <div class="form-group mb-3">
                  <label class="form-label">Which diagnosis do you agree with?</label>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis1" value="1">
                    <label class="form-check-label" for="diagnosis1">Diagnosis 1</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis2" value="2">
                    <label class="form-check-label" for="diagnosis2">Diagnosis 2</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosis3" value="3">
                    <label class="form-check-label" for="diagnosis3">Diagnosis 3</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="diagnosis-feedback" id="diagnosisNone" value="none">
                    <label class="form-check-label" for="diagnosisNone">None of the above</label>
                  </div>
                </div>
                
                <div class="form-group mb-3" id="alternative-diagnosis-container" style="display: none;">
                  <label for="alternative-diagnosis" class="form-label">What is your diagnosis?</label>
                  <textarea class="form-control" id="alternative-diagnosis" rows="3" placeholder="Please enter your diagnosis..."></textarea>
                </div>
                
                <button class="btn btn-primary" onclick="submitDiagnosisFeedback()">Submit Feedback</button>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-sm btn-outline-primary" onclick="printDiagnosis()">Print Report</button>
            </div>
          </div>
        `;
      }
    } else {
      showToast('Visit not found in localStorage', true);
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    showToast('Failed to load visit.', true);
  }
}


// Generate summary from results
function generateSummary(results) {
  const findings = Object.entries(results)
    .filter(([key, value]) => !key.includes('(notes)'))
    .map(([key, value]) => `${key}: ${value}`);
  
  return findings.length > 0 
    ? `Clinical findings: ${findings.join(', ')}` 
    : 'No significant clinical findings';
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


// Add this function to check if both parts are complete
// Update the checkDiagnosisReadiness function
function checkDiagnosisReadiness() {
  // Get current values
  const clinicalComplete = Object.keys(examResults).length > 0;
  const instrumentalNotes = document.getElementById('evaluation-notes').value.trim() !== '';
  const instrumentalFile = uploadedFile !== null;
  const instrumentalComplete = instrumentalNotes || instrumentalFile;
  
  console.log('Diagnosis readiness check:', { 
    clinicalComplete, 
    instrumentalNotes, 
    instrumentalFile,
    instrumentalComplete 
  });
  
  const diagnosisBtn = document.getElementById('diagnosis-btn');
  if (diagnosisBtn) {
    const isReady = clinicalComplete && instrumentalComplete;
    diagnosisBtn.disabled = !isReady;
    
    // Update button text based on status
    if (isReady) {
      diagnosisBtn.textContent = 'Generate Diagnosis';
      diagnosisBtn.classList.remove('btn-secondary');
      diagnosisBtn.classList.add('btn-warning');
    } else {
      let message = 'Complete Both Evaluations to Generate Diagnosis';
      if (!clinicalComplete) message = 'Complete Clinical Evaluation';
      if (!instrumentalComplete) message = 'Complete Instrumental Evaluation';
      if (!clinicalComplete && !instrumentalComplete) message = 'Complete Both Evaluations';
      
      diagnosisBtn.textContent = message;
      diagnosisBtn.classList.remove('btn-warning');
      diagnosisBtn.classList.add('btn-secondary');
    }
  }
}


// Update the callAIService function with a better prompt
async function callAIService(diagnosisData, fileUrl) {
  // Get patient name
  const patients = JSON.parse(localStorage.getItem('patients') || '[]');
  const patient = patients.find(p => p.id === diagnosisData.patientId);
  const patientName = patient ? patient.name : 'Patient';
  
  // Create professional prompt for AI
  const prompt = `
    You are a clinical decision support assistant that helps clinicians evaluate dizzy patients. 
    You will be provided with structured data from the clinical examination, patient history, and vestibular testing. Based on this data, return the top 3 differential diagnoses with confidence scores and relevant treatment suggestions.
    Format the report professionally with appropriate medical terminology, but ensure it can be understood by other healthcare providers.

    PATIENT INFORMATION:
    Name: ${patientName}
    Date of Evaluation: ${new Date().toLocaleDateString()}

    PATIENT HISTORY:
    ${JSON.stringify(diagnosisData.history, null, 2)}
    
    CLINICAL EXAMINATION:
    ${JSON.stringify(diagnosisData.clinicalExam, null, 2)}
    
    INSTRUMENTAL EVALUATION:
    Notes: ${diagnosisData.instrumentalEvaluation.notes || 'None provided'}
    ${fileUrl ? `File: ${fileUrl}` : 'No file uploaded'}
    
    Based on the above information, provide a detailed diagnosis and treatment recommendations. Include patient name and date of birth to generate a professional looking report.
    Respond in the following format:


    ### Diagnostic Possibilities:
    1.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [Short reasoning based on the above findings]

    2.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [...]

    3.⁠ ⁠Diagnosis: [Condition Name]  
      Confidence: [Score]/100  
      Rationale: [...]

    ### Suggested Management or Next Steps:
    •⁠  ⁠[Referral, confirmatory test, medication, or follow-up plan]
  `;
  
  console.log("Prompt", prompt);
  try {
    // Prepare request body
    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a medical specialist in vestibular disorders creating professional diagnosis reports.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000
    };
    
    // Use the API client to make the call (works in both local and AWS environments)
    const data = await ApiClient.callOpenAI(requestBody);
    
    return {
      diagnosis: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error('Failed to generate diagnosis');
  }
}

// Function to submit diagnosis feedback
async function submitDiagnosisFeedback() {
  try {
    const selectedDiagnosis = document.querySelector('input[name="diagnosis-feedback"]:checked');
    
    if (!selectedDiagnosis) {
      showToast('Please select a feedback option', true);
      return;
    }
    
    // Get the diagnosis content and extract the three diagnoses
    const diagnosisContent = document.querySelector('.diagnosis-content').innerHTML;
    
    // Get patient data and clinical information for complete context
    const feedbackData = {
      visitId: visitId || `visit_${Date.now()}`,
      patientId,
      timestamp: new Date().toISOString(),
      selectedOption: selectedDiagnosis.value,
      alternativeDiagnosis: selectedDiagnosis.value === 'none' ? 
        document.getElementById('alternative-diagnosis').value : null,
      // Add these fields for SLM training
      fullDiagnosis: diagnosisContent,
      patientHistory: await getPatientHistory(patientId),
      clinicalExam: examResults,
      instrumentalEvaluation: {
        notes: document.getElementById('evaluation-notes').value,
        fileName: uploadedFile ? uploadedFile.name : null
      }
    };
    
    // Always try to send to central server first
    try {
      // Send to central API endpoint for SLM training data collection
      const response = await fetch('https://api.yourcompany.com/slm-training-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send to central server');
      }
      
      showToast('Thank you for your feedback! Data saved centrally for model training.');
    } catch (centralError) {
      console.error('Error sending to central server:', centralError);
      
      // Fallback to AWS Amplify if available
      if (typeof aws_amplify_api !== 'undefined') {
        const { generateClient } = aws_amplify_api;
        const client = generateClient();
        
        await client.graphql({
          query: `
            mutation CreateDiagnosisFeedback($input: CreateDiagnosisFeedbackInput!) {
              createDiagnosisFeedback(input: $input) {
                id
                visitId
              }
            }
          `,
          variables: {
            input: feedbackData
          }
        });
        
        showToast('Thank you for your feedback! Data saved to AWS for model training.');
      } else {
        // Last resort: save to localStorage
        const feedbackKey = `slm_training_data_${visitId || Date.now()}`;
        localStorage.setItem(feedbackKey, JSON.stringify(feedbackData));
        
        // Also save to IndexedDB for more persistent local storage
        saveToIndexedDB('slm_training_data', feedbackData);
        
        showToast('Thank you for your feedback! Data saved locally (will sync when online).');
      }
    }
    
    // Disable the feedback form
    document.querySelectorAll('input[name="diagnosis-feedback"]').forEach(input => {
      input.disabled = true;
    });
    
    document.getElementById('alternative-diagnosis').disabled = true;
    document.querySelector('button[onclick="submitDiagnosisFeedback()"]').disabled = true;
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showToast('Failed to submit feedback', true);
  }
}

// Helper function to save to IndexedDB for offline storage
function saveToIndexedDB(storeName, data) {
  const request = indexedDB.open('vestibular_diagnosis_db', 1);
  
  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: 'timestamp' });
    }
  };
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(data);
  };
}



// Add these event listeners to check diagnosis readiness
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing visit form');
  init();
  
  // Initial check
  checkDiagnosisReadiness();
  
  // Check when instrumental evaluation changes
  document.getElementById('evaluation-file').addEventListener('change', checkDiagnosisReadiness);
  document.getElementById('evaluation-notes').addEventListener('input', checkDiagnosisReadiness);
  
  // Add diagnosis button event listener
  const diagnosisBtn = document.getElementById('diagnosis-btn');
  if (diagnosisBtn) {
    diagnosisBtn.disabled = true;
    diagnosisBtn.textContent = 'Complete Both Evaluations to Generate Diagnosis';
    diagnosisBtn.classList.add('btn-secondary');
    diagnosisBtn.addEventListener('click', generateDiagnosis);
  }
  
  // Add event listener for the "None of the above" radio button
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'diagnosisNone') {
      document.getElementById('alternative-diagnosis-container').style.display = 'block';
    } else if (e.target && e.target.name === 'diagnosis-feedback' && e.target.id !== 'diagnosisNone') {
      document.getElementById('alternative-diagnosis-container').style.display = 'none';
    }
  });
});


// Initialize when DOM is ready

//document.addEventListener('DOMContentLoaded', init);
// Add event listener for diagnosis button

//document.getElementById('diagnosis-btn').addEventListener('click', generateDiagnosis);

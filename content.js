// Enhanced Content Script for Smart Notes Extension
let currentSelection = '';
let customSubjects = [];

// Load custom subjects from storage
function loadCustomSubjects() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['customSubjects'], (result) => {
      customSubjects = result.customSubjects || [];
      resolve(customSubjects);
    });
  });
}

// Initialize subjects when script loads
loadCustomSubjects();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openNoteModal") {
    currentSelection = message.text;
    showNoteModal(message.text);
  }
});

function createSubjectOptions(selectedSubject = 'General') {
  const defaultSubjects = ['General', 'Work', 'Personal'];
  const allSubjects = [...new Set([...defaultSubjects, ...customSubjects])];
  
  return allSubjects.map(subject => 
    `<option value="${subject}" ${subject === selectedSubject ? 'selected' : ''}>${subject}</option>`
  ).join('');
}

function showNoteModal(text) {
  // Ensure that the selected text preserves line breaks
  const formattedText = text.replace(/\r?\n/g, '\n');
  
  const modal = document.createElement('div');
  modal.id = 'smart-notes-modal';
  modal.innerHTML = `
    <style>
      #smart-notes-modal * {
        box-sizing: border-box;
        font-family: Arial, sans-serif;
      }
      .smart-notes-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      .smart-notes-modal-content {
        background: white;
        border-radius: 12px;
        width: 500px;
        max-width: 90%;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        position: relative;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
      }
      .smart-notes-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .smart-notes-modal-header h2 {
        margin: 0;
        color: #333;
      }
      #smart-notes-text {
        width: 100%;
        min-height: 150px;
        max-height: 300px;
        resize: vertical;
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
      }
      .smart-notes-subject-container {
        display: flex;
        margin-bottom: 15px;
      }
      #smart-notes-subject {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-right: 10px;
      }
      .smart-notes-actions {
        display: flex;
        justify-content: space-between;
      }
      .smart-notes-actions button {
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s ease;
      }
      #smart-notes-save {
        background-color: #4CAF50;
        color: white;
      }
      #smart-notes-save:hover {
        background-color: #45a049;
      }
      #smart-notes-cancel {
        background-color: #f44336;
        color: white;
        margin-left: 10px;
      }
      #smart-notes-cancel:hover {
        background-color: #d32f2f;
      }
      #smart-notes-add-subject {
        width: 40px;
        background-color: #2196F3;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }
      #smart-notes-add-subject:hover {
        background-color: #1976D2;
      }
    </style>
    <div class="smart-notes-overlay">
      <div class="smart-notes-modal-content">
        <div class="smart-notes-modal-header">
          <h2>Save Smart Note</h2>
          <button id="smart-notes-close" style="background:none;border:none;font-size:20px;cursor:pointer;">×</button>
        </div>
        <textarea id="smart-notes-text" rows="4" placeholder="Enter your note here...">${formattedText}</textarea>
        <div class="smart-notes-subject-container">
          <select id="smart-notes-subject">
            ${createSubjectOptions()}
          </select>
          <button id="smart-notes-add-subject">+</button>
        </div>
        <div class="smart-notes-actions">
          <button id="smart-notes-save">Save Note</button>
          <button id="smart-notes-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Event Listeners
  document.getElementById('smart-notes-save').addEventListener('click', saveNote);
  document.getElementById('smart-notes-cancel').addEventListener('click', closeModal);
  document.getElementById('smart-notes-close').addEventListener('click', closeModal);
  
  // Add Subject Functionality
  document.getElementById('smart-notes-add-subject').addEventListener('click', () => {
    const newSubject = prompt('Enter a new subject:');
    if (newSubject && newSubject.trim()) {
      // Add to custom subjects
      if (!customSubjects.includes(newSubject.trim())) {
        customSubjects.push(newSubject.trim());
        
        // Save to chrome storage
        chrome.storage.sync.set({customSubjects: customSubjects}, () => {
          // Update the select options
          const subjectSelect = document.getElementById('smart-notes-subject');
          subjectSelect.innerHTML = createSubjectOptions(newSubject.trim());
        });
      }
    }
  });
}

function saveNote() {
  const text = document.getElementById('smart-notes-text').value;
  const subject = document.getElementById('smart-notes-subject').value;
  
  if (!text.trim()) {
    alert('Please enter a note before saving.');
    return;
  }

  const noteData = {
    text: text,
    subject: subject,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userId: 'user_id_placeholder', // Replace with actual user ID
    metadata: {
      pageTitle: document.title,
      domain: window.location.hostname
    }
  };

  chrome.runtime.sendMessage({
    action: 'syncNote',
    noteData: noteData,
    token: 'user_authentication_token' // Replace with actual authentication
  }, (response) => {
    if (response.status === 'success') {
      alert('Note saved successfully!');
      closeModal();
    } else {
      alert('Failed to save note. Please try again.');
    }
  });
}

function closeModal() {
  const modal = document.getElementById('smart-notes-modal');
  if (modal) {
    document.body.removeChild(modal);
  }
}

// Listen for custom subject updates from storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.customSubjects) {
    customSubjects = changes.customSubjects.newValue || [];
    // Optionally update UI if modal is open
  }
});
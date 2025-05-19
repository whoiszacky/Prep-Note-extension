chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "smartNotes",
    title: "Save to Smart Notes",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "smartNotes") {
    if (tab && tab.id && tab.url && tab.url.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, {
        action: "openNoteModal",
        text: info.selectionText
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
      });
    } else {
      console.error('Tab not found or URL not supported');
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "syncNote") {
    fetch('http://localhost:5001/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + message.token
      },
      body: JSON.stringify(message.noteData)
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({status: 'success', data: data});
    })
    .catch(error => {
      sendResponse({status: 'error', error: error});
    });
    return true; // Keep the message channel open for sendResponse
  }
});
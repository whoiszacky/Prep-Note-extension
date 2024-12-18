document.getElementById('add-subject').addEventListener('click', () => {
    const newSubject = document.getElementById('new-subject').value.trim();
    if (newSubject) {
      const subjectList = document.getElementById('subjects');
      const newLi = document.createElement('li');
      newLi.textContent = newSubject;
      subjectList.appendChild(newLi);
  
      chrome.storage.sync.get(['subjects'], (result) => {
        const subjects = result.subjects || [];
        subjects.push(newSubject);
        chrome.storage.sync.set({subjects: subjects});
      });
  
      document.getElementById('new-subject').value = '';
    }
  });
  
  chrome.storage.sync.get(['subjects'], (result) => {
    const subjectList = document.getElementById('subjects');
    const storedSubjects = result.subjects || [];
    storedSubjects.forEach(subject => {
      const li = document.createElement('li');
      li.textContent = subject;
      subjectList.appendChild(li);
    });
  });
  
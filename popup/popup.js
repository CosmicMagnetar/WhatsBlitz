import * as XLSX from 'xlsx';
import Papa from 'papaparse';

let contacts = [];

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('startBtn').addEventListener('click', startMessaging);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const ext = file.name.split('.').pop();

  if (ext === 'csv') {
    reader.onload = (e) => parseCSV(e.target.result);
    reader.readAsText(file);
  } else {
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      contacts = json;
      console.log('Parsed Contacts:', contacts);
      updateProgress(0);
    };
    reader.readAsArrayBuffer(file);
  }
}

function parseCSV(data) {
  const parsed = Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      contacts = results.data;
      console.log('Parsed Contacts:', contacts);
      updateProgress(0);
    },
  });
}

function updateProgress(percent) {
  document.getElementById('progressBar').style.width = `${percent}%`;
}

function startMessaging() {
  if (!contacts.length) {
    alert('Please upload a file first!');
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: sendContactsToContent,
      args: [contacts],
    });
  });

  updateProgress(100);
}

function sendContactsToContent(contacts) {
  window.postMessage({ type: 'WHATSBLITZ_CONTACTS', contacts }, '*');
}
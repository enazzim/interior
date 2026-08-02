import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

if ((window as any).electronAPI) {
  axios.defaults.baseURL = 'http://localhost:38080';
} else if (import.meta.env.DEV) {
  axios.defaults.baseURL = '';
} else {
  axios.defaults.baseURL = window.location.protocol + '//' + window.location.hostname + ':8080';
}

// Electron에서 네이티브 alert 및 confirm 창이 닫힌 후 키보드 포커스를 즉시 회복 (딜레이 0ms 화)
const originalAlert = window.alert;
window.alert = (message) => {
  if ((window as any).electronAPI) {
    (window as any).electronAPI.showAlert(message);
  } else {
    originalAlert(message);
  }
  const activeEl = document.activeElement;
  if (activeEl instanceof HTMLElement) {
    activeEl.focus();
  }
  axios.post('/api/window/focus').catch(() => {});
};

const originalConfirm = window.confirm;
window.confirm = (message) => {
  let result = false;
  if ((window as any).electronAPI) {
    result = (window as any).electronAPI.showConfirm(message);
  } else {
    result = originalConfirm(message);
  }
  const activeEl = document.activeElement;
  if (activeEl instanceof HTMLElement) {
    activeEl.focus();
  }
  axios.post('/api/window/focus').catch(() => {});
  return result;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Electron 환경일 경우 로컬 포트 38080 고정, 웹 브라우저 배포 모드일 경우 EC2 백엔드 주소로 통신
if ((window as any).electronAPI) {
  axios.defaults.baseURL = 'http://localhost:38080';
} else {
  axios.defaults.baseURL = window.location.protocol + '//' + window.location.hostname + ':38080';
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

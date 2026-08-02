const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let javaProcess;

function startJavaBackend() {
  // 패키징 모드와 개발 모드 분기
  // resources 폴더 내에 backend.jar 를 위치시켜 배포합니다.
  const jarPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'backend.jar') 
    : path.join(__dirname, '../backend/build/libs/backend-0.0.1-SNAPSHOT.jar');

  // SQLite DB 파일이 위치할 폴더를 미리 생성합니다.
  const fs = require('fs');
  const dbDir = path.join(app.getPath('appData'), 'InteriorERP');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log(`Starting Java backend from: ${jarPath}`);

  // child_process 로 백그라운드 기동 (prod, desktop 프로필 활성화)
  javaProcess = spawn('java', ['-jar', jarPath, '--spring.profiles.active=prod,desktop']);

  javaProcess.stdout.on('data', (data) => {
    console.log(`[Java Stdout]: ${data}`);
  });

  javaProcess.stderr.on('data', (data) => {
    console.error(`[Java Stderr]: ${data}`);
  });
}

function checkBackendHealth(onSuccess) {
  const options = {
    hostname: 'localhost',
    port: 38080,
    path: '/api/projects',
    method: 'GET',
    timeout: 1000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404) {
      // 200 OK 외에도 서버가 응답을 주는 상태코드면 서버가 구동된 것으로 간주
      onSuccess();
    } else {
      setTimeout(() => checkBackendHealth(onSuccess), 1000);
    }
  });

  req.on('error', () => {
    setTimeout(() => checkBackendHealth(onSuccess), 1000);
  });

  req.end();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: "Interior"
  });

  // 상단 메뉴바 완전히 제거
  mainWindow.setMenu(null);

  // Electron alert/confirm 포커스 상실 버그 방지 로직
  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.webContents.focus();
    }
  });

  // 패키징 완료 시 dist/index.html 로드
  const indexPath = app.isPackaged
    ? `file://${path.join(__dirname, 'dist', 'index.html')}`
    : 'http://localhost:5173'; // 개발 환경인 경우 vite 개발 서버 주소

  mainWindow.loadURL(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // 백엔드 기동 시작
  startJavaBackend();

  // 백엔드가 성공적으로 가동되면 화면 생성
  checkBackendHealth(() => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // 앱 종료 시 자바 프로세스 확실히 종료
  if (javaProcess) {
    console.log('Killing Java backend process...');
    javaProcess.kill();
  }
});

app.on('browser-window-focus', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.focus();
  }
});

// 동기식 네이티브 모달 다이얼로그 호출 수신기
ipcMain.on('show-alert-sync', (event, message) => {
  dialog.showMessageBoxSync(null, {
    type: 'info',
    buttons: ['확인'],
    title: '알림',
    message: String(message),
    noLink: true
  });
  event.returnValue = true;
});

ipcMain.on('show-confirm-sync', (event, message) => {
  let result = 1; // 기본 취소
  result = dialog.showMessageBoxSync(null, {
    type: 'question',
    buttons: ['확인', '취소'],
    defaultId: 0,
    cancelId: 1,
    title: '확인',
    message: String(message),
    noLink: true
  });
  event.returnValue = (result === 0); // 0이면 확인(true), 1이면 취소(false)
});

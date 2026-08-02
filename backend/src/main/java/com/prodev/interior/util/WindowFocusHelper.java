package com.prodev.interior.util;

import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef.HWND;
import com.sun.jna.platform.win32.WinDef.DWORD;
import com.sun.jna.platform.win32.WinUser;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class WindowFocusHelper {

    public static void focusWindow(String windowTitle) {
        String os = System.getProperty("os.name").toLowerCase();
        if (!os.contains("win")) {
            log.info("Non-Windows OS detected. Skipping Win32 focus recovery.");
            return;
        }

        try {
            HWND hwnd = User32.INSTANCE.FindWindow(null, windowTitle);
            if (hwnd == null) {
                log.warn("Could not find window with title: {}", windowTitle);
                return;
            }

            log.info("Found application window HWND. Recovering focus...");

            // 윈도우 활성화 및 복구 (최대화 상태 유지를 위해 주석 처리)
            // User32.INSTANCE.ShowWindow(hwnd, WinUser.SW_RESTORE);
            // User32.INSTANCE.ShowWindow(hwnd, WinUser.SW_SHOW);
            
            // 스레드 어태치 기법으로 OS 포커싱 강제 매핑
            int foregroundId = User32.INSTANCE.GetWindowThreadProcessId(User32.INSTANCE.GetForegroundWindow(), null);
            int currentId = User32.INSTANCE.GetWindowThreadProcessId(hwnd, null);

            if (foregroundId != currentId) {
                DWORD fgThread = new DWORD(foregroundId);
                DWORD curThread = new DWORD(currentId);
                
                User32.INSTANCE.AttachThreadInput(fgThread, curThread, true);
                User32.INSTANCE.SetForegroundWindow(hwnd);
                User32.INSTANCE.SetFocus(hwnd);
                User32.INSTANCE.AttachThreadInput(fgThread, curThread, false);
            } else {
                User32.INSTANCE.SetForegroundWindow(hwnd);
                User32.INSTANCE.SetFocus(hwnd);
            }
            
            log.info("System window focus recovered successfully.");
        } catch (Throwable e) {
            log.error("Failed to recover OS level window focus via JNA", e);
        }
    }
}

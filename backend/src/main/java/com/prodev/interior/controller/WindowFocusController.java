package com.prodev.interior.controller;

import com.prodev.interior.util.WindowFocusHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/window")
public class WindowFocusController {

    @PostMapping("/focus")
    public ResponseEntity<String> recoverWindowFocus() {
        WindowFocusHelper.focusWindow("Interior");
        return ResponseEntity.ok("Focus recovery signal triggered.");
    }
}

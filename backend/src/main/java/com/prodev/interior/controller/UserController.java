package com.prodev.interior.controller;

import com.prodev.interior.domain.User;
import com.prodev.interior.dto.UserDTO;
import com.prodev.interior.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.prodev.interior.dto.LoginRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 서버가 재부팅/재빌드될 때마다 새로 생성되는 서버 고유 구동 토큰
    private static final String SERVER_BOOT_ID = UUID.randomUUID().toString();
    private static final long SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000L; // 8시간 세션 만료

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserDTO dto) {
        return ResponseEntity.ok(userService.createUser(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserDTO dto) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session-check")
    public ResponseEntity<?> checkSession() {
        Map<String, Object> res = new HashMap<>();
        res.put("bootId", SERVER_BOOT_ID);
        res.put("serverTime", System.currentTimeMillis());
        res.put("sessionTimeoutMs", SESSION_TIMEOUT_MS);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            User user = userService.login(loginRequest.getLoginId(), loginRequest.getPassword());
            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("bootId", SERVER_BOOT_ID);
            response.put("loginTimestamp", System.currentTimeMillis());
            response.put("expiresIn", SESSION_TIMEOUT_MS);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}

package com.prodev.interior.service;

import com.prodev.interior.domain.User;
import com.prodev.interior.domain.Company;
import com.prodev.interior.dto.UserDTO;
import com.prodev.interior.repository.UserRepository;
import com.prodev.interior.repository.CompanyRepository;
import com.prodev.interior.repository.ProjectStateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ProjectStateHistoryRepository projectStateHistoryRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID: " + userId));
    }

    @Transactional
    public User createUser(UserDTO dto) {
        Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default Company not found"));

        User user = User.builder()
                .company(company)
                .username(dto.getUsername())
                .loginId(dto.getLoginId())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long userId, UserDTO dto) {
        User user = getUserById(userId);
        user.updateUserInfo(dto.getUsername(), passwordEncoder.encode(dto.getPassword()), dto.getRole());
        return user;
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        // 외래키 무결성 해결을 위해 해당 유저의 타임라인 기록 주체를 null 로 사전에 단절 처리
        projectStateHistoryRepository.nullifyChangedBy(userId);
        userRepository.delete(user);
    }

    public User login(String loginId, String password) {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return user;
    }
}

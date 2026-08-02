package com.prodev.interior.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long userId;
    private String username;
    private String loginId;
    private String password;
    private String role; // ADMIN, STAFF
}

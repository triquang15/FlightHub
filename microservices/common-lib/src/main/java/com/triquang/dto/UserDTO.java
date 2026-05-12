package com.triquang.dto;

import java.time.LocalDateTime;

import com.triquang.enums.UserRole;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private Long id;

    private String email;

    private String fullName;

    private String phone;

    private UserRole role;

    private LocalDateTime lastLogin;

    // ===== STATUS =====
    private boolean verified;

    private boolean active;

    // ===== AUDIT =====
    private LocalDateTime createdAt;
}
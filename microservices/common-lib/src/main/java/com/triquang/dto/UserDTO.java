package com.triquang.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.triquang.enums.AuthProvider;
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

    private String avatarUrl;

    private String profilePicture;

    private boolean hasCustomAvatar;

    private LocalDateTime lastLogin;

    private List<AuthProvider> loginProviders;

    private AuthProvider lastLoginProvider;

    private LocalDateTime lastProviderLoginAt;

    // ===== STATUS =====
    private boolean verified;

    private boolean active;

    // ===== AUDIT =====
    private LocalDateTime createdAt;
}

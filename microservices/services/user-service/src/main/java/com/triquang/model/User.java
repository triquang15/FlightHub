package com.triquang.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.triquang.enums.UserRole;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_email", columnList = "email")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    // ===== STATUS =====
    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    // ===== TOKEN VERSION =====
    @Builder.Default
    @Column(nullable = false)
    private Integer tokenVersion = 0;

    private LocalDateTime lastLogin;

    @Column(length = 1000)
    private String avatarUrl;

    @Column(length = 512)
    private String avatarObjectKey;

    private LocalDateTime avatarUpdatedAt;

    // ===== PASSWORD RESET (HASH ONLY) =====
    private String resetTokenHash;

    private LocalDateTime resetTokenExpiry;

    // ===== AUDIT =====
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

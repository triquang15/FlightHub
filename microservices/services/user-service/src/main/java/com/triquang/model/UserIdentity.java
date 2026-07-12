package com.triquang.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.triquang.enums.AuthProvider;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "user_identities",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_identity_provider_subject", columnNames = {"provider", "provider_user_id"})
    },
    indexes = {
        @Index(name = "idx_identity_user", columnList = "user_id"),
        @Index(name = "idx_identity_email", columnList = "provider_email"),
        @Index(name = "idx_identity_provider", columnList = "provider")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuthProvider provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(name = "provider_email", length = 255)
    private String providerEmail;

    @Column(length = 255)
    private String displayName;

    @Column(length = 1000)
    private String avatarUrl;

    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime linkedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

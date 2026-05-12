package com.triquang.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "sessions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_device", columnNames = {"user_id", "device_id"})
    },
    indexes = {
        @Index(name = "idx_session_user", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== RELATION =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ===== DEVICE =====
    @Column(nullable = false)
    private String deviceId;

    private String ipAddress;

    @Column(length = 1000)
    private String userAgent;

    private LocalDateTime lastActive;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
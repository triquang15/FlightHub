package com.triquang.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "known_devices",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_known_device_user_device", columnNames = {"user_id", "device_id"})
    },
    indexes = {
        @Index(name = "idx_known_device_user", columnList = "user_id"),
        @Index(name = "idx_known_device_user_device", columnList = "user_id, device_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnownDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String deviceId;

    private String ipAddress;

    @Column(length = 1000)
    private String userAgent;

    private LocalDateTime lastSeenAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime firstSeenAt;
}

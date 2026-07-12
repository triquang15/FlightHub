package com.triquang.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.triquang.enums.AuthProvider;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "login_audit",
    indexes = {
        @Index(name = "idx_login_email", columnList = "email"),
        @Index(name = "idx_login_created", columnList = "createdAt"),
        @Index(name = "idx_login_email_success", columnList = "email, success")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private Boolean success;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private AuthProvider provider;

    private String ipAddress;

    private String userAgent;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

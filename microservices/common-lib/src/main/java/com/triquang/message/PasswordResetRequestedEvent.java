package com.triquang.message;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequestedEvent {
    private Long userId;
    private String email;
    private String fullName;
    private String resetToken;
    private LocalDateTime expiresAt;
    private LocalDateTime requestedAt;
}

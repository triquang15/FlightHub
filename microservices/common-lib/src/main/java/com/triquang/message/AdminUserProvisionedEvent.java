package com.triquang.message;

import java.time.LocalDateTime;

import com.triquang.enums.UserRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserProvisionedEvent {
    private String eventId;
    private Long userId;
    private String email;
    private String fullName;
    private UserRole role;
    private String createdBy;
    private LocalDateTime createdAt;
    private String loginUrl;
}

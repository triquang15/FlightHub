package com.triquang.message;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspiciousLoginEvent {
    private Long userId;
    private String email;
    private String deviceId;
    private String ip;
    private LocalDateTime timestamp;
}

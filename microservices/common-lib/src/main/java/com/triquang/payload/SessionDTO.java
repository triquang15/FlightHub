package com.triquang.payload;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionDTO {

    private String deviceId;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime lastActive;
}

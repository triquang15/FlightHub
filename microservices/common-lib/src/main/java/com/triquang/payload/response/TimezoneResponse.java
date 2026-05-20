package com.triquang.payload.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimezoneResponse {

    private String value;   // Asia/Ho_Chi_Minh
    private String label;   // (UTC+07:00) Ho Chi Minh
    private String offset;  // +07:00
    private String region;  // Asia
}

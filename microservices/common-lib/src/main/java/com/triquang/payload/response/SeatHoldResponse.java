package com.triquang.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatHoldResponse {
    private String holdToken;
    private Instant holdExpiresAt;
    private List<SeatInstanceResponse> seats;
}

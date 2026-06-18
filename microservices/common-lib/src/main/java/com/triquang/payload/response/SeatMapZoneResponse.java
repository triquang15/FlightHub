package com.triquang.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapZoneResponse {
    private Long id;
    private String name;
    private Integer startRow;
    private Integer endRow;
    private Integer leftSeatsPerRow;
    private Integer rightSeatsPerRow;
    private Integer seatsInLastRow;
    private Integer displayOrder;
    private Integer totalRows;
    private Integer totalSeats;
}

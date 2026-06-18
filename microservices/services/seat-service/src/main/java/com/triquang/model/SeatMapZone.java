package com.triquang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "seat_map_zones",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_seat_map_zone_row_range",
                        columnNames = {"seat_map_id", "start_row", "end_row"}
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "start_row", nullable = false)
    private Integer startRow;

    @Column(name = "end_row", nullable = false)
    private Integer endRow;

    @Column(nullable = false)
    private Integer leftSeatsPerRow;

    @Column(nullable = false)
    private Integer rightSeatsPerRow;

    private Integer seatsInLastRow;

    @Builder.Default
    @Column(nullable = false)
    private Integer displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_map_id", nullable = false)
    private SeatMap seatMap;

    public int getRows() {
        return endRow - startRow + 1;
    }

    public int getSeatsPerStandardRow() {
        return leftSeatsPerRow + rightSeatsPerRow;
    }

    public int getTotalSeats() {
        int standardSeats = getRows() * getSeatsPerStandardRow();
        if (seatsInLastRow == null) {
            return standardSeats;
        }
        return standardSeats - getSeatsPerStandardRow() + seatsInLastRow;
    }
}

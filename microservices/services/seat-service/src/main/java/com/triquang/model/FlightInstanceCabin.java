package com.triquang.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "flight_instance_cabins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"cabinClass", "seats"})
@EqualsAndHashCode(exclude = {"cabinClass", "seats"})
public class FlightInstanceCabin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-service ref: FlightInstance is in flight-ops-service
    @Column(name = "flight_instance_id", nullable = false)
    private Long flightInstanceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cabin_class_id", nullable = false)
    private CabinClass cabinClass;

    @Column(nullable = false)
    private Integer totalSeats;

    private Integer bookedSeats = 0;

    @Builder.Default
    @OneToMany(
            mappedBy = "flightInstanceCabin",
            cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SeatInstance> seats = new ArrayList<>();

    public Integer getAvailableSeats() {
        return totalSeats - bookedSeats;
    }
}

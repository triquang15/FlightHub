package com.triquang.model;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.triquang.embeddable.Support;
import com.triquang.enums.AirlineStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)

@Table(
    name = "airlines",
    indexes = {
        @Index(name = "idx_airline_iata", columnList = "iata_code"),
        @Index(name = "idx_airline_icao", columnList = "icao_code"),
        @Index(name = "idx_airline_owner", columnList = "owner_id"),
        @Index(name = "idx_airline_status", columnList = "status"),
        @Index(name = "idx_airline_city", columnList = "headquarters_city_id")
    }
)
public class Airline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false, nullable = false)
    private Long id;

    @Size(min = 2, max = 2)
    @Column(name = "iata_code", length = 2, nullable = false, unique = true)
    private String iataCode;

    @Size(min = 3, max = 3)
    @Column(name = "icao_code", length = 3, nullable = false, unique = true)
    private String icaoCode;

    @Column(nullable = false)
    private String name;

    private String alias;

    private String logoUrl;

    @Column(name = "logo_object_key", length = 512)
    private String logoObjectKey;

    private String website;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AirlineStatus status;

    private String alliance;

    @Embedded
    private Support support;

    // ================= CROSS SERVICE =================
    @Column(name = "headquarters_city_id")
    private Long headquartersCityId;

    @Column(name = "owner_id", updatable = false, nullable = false)
    private Long ownerId;

    @Column(name = "updated_by_user_id")
    private Long updatedById;

    // ================= AUDIT =================
    @CreatedDate
    @Column(updatable = false, nullable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    // ================= DEFAULT =================
    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = AirlineStatus.PENDING;
        }
    }
}

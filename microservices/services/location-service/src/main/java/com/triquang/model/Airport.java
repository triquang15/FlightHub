package com.triquang.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZoneId;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.triquang.embeddable.Address;
import com.triquang.embeddable.Analytics;
import com.triquang.embeddable.GeoCode;

@Entity
@Table(name = "airports", indexes = {
        @Index(name = "idx_airport_iata", columnList = "iataCode"),
        @Index(name = "idx_airport_city_id", columnList = "city_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "city" })
public class Airport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @ToString.Include
    private Long id;

    @Column(nullable = false, length = 3, unique = true)
    @EqualsAndHashCode.Include
    @ToString.Include
    private String iataCode;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "time_zone_id", length = 50)
    private String timeZoneId;

    @Embedded
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private City city;

    @Embedded
    private GeoCode geoCode;

    @Embedded
    private Analytics analytics;

    @Column(name = "hero_image_url", length = 1024)
    private String heroImageUrl;

    @Column(name = "hero_image_object_key", length = 512)
    private String heroImageObjectKey;

    // ================= SAFE TIMEZONE =================
    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public ZoneId getTimeZone() {
        return TimeZoneUtil.safeZone(timeZoneId);
    }

    public void setTimeZone(ZoneId zoneId) {
        this.timeZoneId = zoneId != null ? zoneId.getId() : null;
    }

    // ================= DERIVED =================
    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getDetailedName() {
        if (city != null && city.getCountryCode() != null) {
            return name.toUpperCase() + "/" + city.getCountryCode();
        }
        return name.toUpperCase();
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getCityName() {
        return city != null ? city.getName() : null;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getCountryName() {
        return city != null ? city.getCountryName() : null;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getCountryCode() {
        return city != null ? city.getCountryCode() : null;
    }
}

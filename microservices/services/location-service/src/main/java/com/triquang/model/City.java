package com.triquang.model;

import java.time.Instant;
import java.time.ZoneId;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;


@Entity
@Table(name = "cities", indexes = {
        @Index(name = "idx_city_code", columnList = "cityCode"),
        @Index(name = "idx_city_name", columnList = "name"),
        @Index(name = "idx_country_code", columnList = "countryCode")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Size(max = 10)
    @Column(nullable = false, unique = true)
    private String cityCode;

    @NotBlank
    @Size(max = 5)
    @Column(nullable = false)
    private String countryCode;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String countryName;

    @Size(max = 10)
    private String regionCode;

    @Column(name = "time_zone_id", length = 50)
    private String timeZoneId;

    // ================= SAFE TIMEZONE =================
    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public ZoneId getTimeZone() {
        return TimeZoneUtil.safeZone(timeZoneId);
    }

    public void setTimeZone(ZoneId zoneId) {
        this.timeZoneId = zoneId != null ? zoneId.getId() : null;
    }

    // ================= OFFSET =================
    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getCurrentUtcOffset() {
        try {
            ZoneId zone = TimeZoneUtil.safeZone(timeZoneId);
            return zone != null
                    ? zone.getRules().getOffset(Instant.now()).toString()
                    : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getStandardUtcOffset() {
        try {
            ZoneId zone = TimeZoneUtil.safeZone(timeZoneId);
            return zone != null
                    ? zone.getRules().getStandardOffset(Instant.now()).toString()
                    : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean observesDaylightSaving() {
        try {
            ZoneId zone = TimeZoneUtil.safeZone(timeZoneId);
            return zone != null && !zone.getRules().getTransitionRules().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
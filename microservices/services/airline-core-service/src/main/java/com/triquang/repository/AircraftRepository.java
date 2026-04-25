package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.enums.AircraftStatus;
import com.triquang.model.Aircraft;
import com.triquang.model.Airline;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AircraftRepository extends JpaRepository<Aircraft, Long> {

    Optional<Aircraft> findByCode(String code);

    boolean existsByCode(String code);

    List<Aircraft> findByStatus(AircraftStatus status);

    List<Aircraft> findByAirline(Airline airline);

    List<Aircraft> findByAirlineAndStatus(Airline airline, AircraftStatus status);

    List<Aircraft> findByAirlineAndStatusAndIsAvailable(Airline airline, AircraftStatus status, Boolean isAvailable);

    List<Aircraft> findByModelContainingIgnoreCase(String model);

    List<Aircraft> findByNextMaintenanceDateBefore(LocalDate date);
}

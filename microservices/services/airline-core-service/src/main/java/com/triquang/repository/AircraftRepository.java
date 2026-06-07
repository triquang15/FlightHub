package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.triquang.enums.AircraftStatus;
import com.triquang.model.Aircraft;
import com.triquang.model.Airline;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AircraftRepository extends JpaRepository<Aircraft, Long>, JpaSpecificationExecutor<Aircraft> {

    Optional<Aircraft> findByCode(String code);

    boolean existsByCode(String code);

    List<Aircraft> findByStatus(AircraftStatus status);

    List<Aircraft> findByAirline(Airline airline);

    List<Aircraft> findByAirlineIn(List<Airline> airlines);

    List<Aircraft> findByAirlineOwnerIdOrderByCodeAsc(Long ownerId);

    List<Aircraft> findByAirlineAndStatus(Airline airline, AircraftStatus status);

    List<Aircraft> findByAirlineAndStatusAndIsAvailable(Airline airline, AircraftStatus status, Boolean isAvailable);

    List<Aircraft> findByModelContainingIgnoreCase(String model);

    List<Aircraft> findByNextMaintenanceDateBefore(LocalDate date);

    long countByAirlineOwnerId(Long ownerId);

    long countByAirlineOwnerIdAndStatus(Long ownerId, AircraftStatus status);

    @Query("""
            SELECT COALESCE(SUM(a.seatingCapacity), 0)
            FROM Aircraft a
            WHERE a.airline.ownerId = :ownerId
            """)
    long sumSeatingCapacityByOwnerId(Long ownerId);
}

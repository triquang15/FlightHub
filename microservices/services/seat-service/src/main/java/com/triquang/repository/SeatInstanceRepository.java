package com.triquang.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.triquang.model.SeatInstance;
import com.triquang.enums.SeatAvailabilityStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SeatInstanceRepository extends JpaRepository<SeatInstance, Long> {
    List<SeatInstance> findByFlightId(Long flightId);
    List<SeatInstance> findByFlightInstanceId(Long flightInstanceId);
    List<SeatInstance> findByFlightScheduleId(Long flightScheduleId);
    List<SeatInstance> findBySeatId(Long seatId);
    List<SeatInstance> findByFlightInstanceCabinId(Long id);
    boolean existsByFlightInstanceId(Long flightInstanceId);

    @Query("SELECT si FROM SeatInstance si WHERE si.flightId = :flightId AND si.status = 'AVAILABLE'")
    List<SeatInstance> findAvailableByFlightId(@Param("flightId") Long flightId);

    @Query("SELECT si FROM SeatInstance si WHERE si.flightInstanceId = :flightInstanceId AND si.status = 'AVAILABLE'")
    List<SeatInstance> findAvailableByFlightInstanceId(@Param("flightInstanceId") Long flightInstanceId);

    @Query("SELECT si FROM SeatInstance si WHERE si.flightId = :flightId AND si.status = 'OCCUPIED'")
    List<SeatInstance> findOccupiedByFlightId(@Param("flightId") Long flightId);

    Long countByFlightId(Long flightId);

    @Query("SELECT COUNT(si) FROM SeatInstance si WHERE si.flightId = :flightId AND si.status = 'AVAILABLE'")
    Long countAvailableByFlightId(@Param("flightId") Long flightId);

    @Query("SELECT COUNT(si) FROM SeatInstance si WHERE si.flightInstanceId = :flightInstanceId AND si.status = 'AVAILABLE'")
    Long countAvailableByFlightInstanceId(@Param("flightInstanceId") Long flightInstanceId);

    Long countByFlightInstanceCabinIdAndStatus(Long flightInstanceCabinId, SeatAvailabilityStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT si FROM SeatInstance si WHERE si.id = :seatInstanceId")
    Optional<SeatInstance> findByIdForUpdate(@Param("seatInstanceId") Long seatInstanceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT si FROM SeatInstance si WHERE si.id IN :seatInstanceIds")
    List<SeatInstance> findAllByIdForUpdate(@Param("seatInstanceIds") List<Long> seatInstanceIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT si FROM SeatInstance si
            WHERE si.flightInstanceId = :flightInstanceId
              AND si.status = 'HELD'
              AND si.holdExpiresAt IS NOT NULL
              AND si.holdExpiresAt <= :now
            """)
    List<SeatInstance> findExpiredHoldsByFlightInstanceIdForUpdate(
            @Param("flightInstanceId") Long flightInstanceId,
            @Param("now") Instant now);
}

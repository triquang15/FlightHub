package com.triquang.repository;

import com.triquang.model.SeatMapZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatMapZoneRepository extends JpaRepository<SeatMapZone, Long> {
    List<SeatMapZone> findBySeatMapIdOrderByDisplayOrderAscStartRowAsc(Long seatMapId);
    void deleteBySeatMapId(Long seatMapId);
}

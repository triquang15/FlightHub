package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.model.Ancillary;

import java.util.List;

public interface AncillaryRepository extends JpaRepository<Ancillary, Long> {

    List<Ancillary> findByAirlineId(Long airlineId);
}

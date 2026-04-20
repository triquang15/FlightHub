package com.triquang.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.model.Airport;

public interface AirportRepository extends JpaRepository<Airport, Long> {

	Optional<Airport> findByIataCode(String iataCode);

	List<Airport> findByCityId(Long cityId);
}

package com.triquang.repository;

import com.triquang.model.Airport;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AirportRepository extends JpaRepository<Airport, Long>, JpaSpecificationExecutor<Airport> {

    Optional<Airport> findByIataCode(String iataCode);

    boolean existsByIataCode(String iataCode);

    @Query("SELECT a FROM Airport a JOIN FETCH a.city WHERE a.id = :id")
    Optional<Airport> findByIdWithCity(@Param("id") Long id);

    @Query("SELECT a FROM Airport a JOIN FETCH a.city")
    List<Airport> findAllWithCity();

    List<Airport> findByCityId(Long cityId);

    @Query("SELECT a FROM Airport a WHERE a.iataCode IN :codes")
    List<Airport> findAllByIataCodeIn(@Param("codes") List<String> codes);
}
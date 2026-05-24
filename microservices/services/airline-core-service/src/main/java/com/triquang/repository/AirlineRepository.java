package com.triquang.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.triquang.enums.AirlineStatus;
import com.triquang.model.Airline;

public interface AirlineRepository extends JpaRepository<Airline, Long>, JpaSpecificationExecutor<Airline> {

    List<Airline> findAllByOwnerId(Long ownerId);

    Optional<Airline> findByIataCode(String code);

    Optional<Airline> findByIcaoCode(String code);

    boolean existsByIataCode(String code);

    boolean existsByIcaoCode(String code);

    Page<Airline> findByStatus(AirlineStatus status, Pageable pageable);

    List<Airline> findByStatus(AirlineStatus status);

    @Query("SELECT a FROM Airline a " +
            "WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(a.iataCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(a.icaoCode) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Airline> searchByKeyword(String keyword, Pageable pageable);

    // Bulk resolve
    List<Airline> findAllByIataCodeIn(Collection<String> iataCodes);

    // Alliance filter
    List<Airline> findAllByAllianceIgnoreCase(String alliance);

    Optional<Airline> findByOwnerId(Long ownerId);
}

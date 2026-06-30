package com.triquang.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.triquang.model.Passenger;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {

    List<Passenger> findByPrimaryUserId(Long primaryUserId);

    List<Passenger> findByPrimaryUserIdAndIsActiveTrueOrderByUpdatedAtDesc(Long primaryUserId);

    Optional<Passenger> findByPrimaryUserIdAndEmailAndPhoneAndDateOfBirth(
            Long primaryUserId, String email, String phone, LocalDate dateOfBirth);

    Optional<Passenger> findByPrimaryUserIdAndPassportNumber(Long primaryUserId, String passportNumber);

    List<Passenger> findByEmail(String email);

    List<Passenger> findByLastNameContainingIgnoreCase(String lastName);

    @Query("SELECT p FROM Passenger p WHERE " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Passenger> findByNameContaining(@Param("name") String name);

    long countByPrimaryUserId(Long primaryUserId);

    Page<Passenger> findByPrimaryUserId(Long primaryUserId, Pageable pageable);

    @Query("SELECT p FROM Passenger p WHERE p.isActive = true")
    List<Passenger> findAllActive();
}

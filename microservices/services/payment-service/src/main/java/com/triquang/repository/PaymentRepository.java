package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.triquang.enums.PaymentStatus;
import com.triquang.model.Payment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import jakarta.persistence.LockModeType;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

	Optional<Payment> findByBookingId(Long bookingId);

	Optional<Payment> findTopByBookingIdOrderByUpdatedAtDesc(Long bookingId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from Payment p where p.id = :id")
	Optional<Payment> findByIdForUpdate(@Param("id") Long id);

	@Query(value = "select pg_advisory_xact_lock(:bookingId)", nativeQuery = true)
	void lockBookingPayment(@Param("bookingId") Long bookingId);

	Optional<Payment> findByTransactionId(String transactionId);

	List<Payment> findByStatus(PaymentStatus status);

	List<Payment> findByBookingIdIn(Collection<Long> bookingIds);

	List<Payment> findByBookingIdInOrderByUpdatedAtDesc(Collection<Long> bookingIds);

	List<Payment> findByStatusInAndExpiresAtBefore(
			Collection<PaymentStatus> statuses, LocalDateTime expiresAt);
}

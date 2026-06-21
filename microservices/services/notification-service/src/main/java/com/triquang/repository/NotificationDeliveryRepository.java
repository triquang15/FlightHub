package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;

import com.triquang.enums.DeliveryStatus;
import com.triquang.model.NotificationDelivery;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, Long>, JpaSpecificationExecutor<NotificationDelivery> {
    Optional<NotificationDelivery> findByDeliveryKey(String deliveryKey);

    @EntityGraph(attributePaths = "event")
    Optional<NotificationDelivery> findWithEventById(Long id);

    Page<NotificationDelivery> findByStatus(DeliveryStatus status, Pageable pageable);

    long countByStatus(DeliveryStatus status);
}

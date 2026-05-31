package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.triquang.model.NotificationEvent;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long>, JpaSpecificationExecutor<NotificationEvent> {
    Optional<NotificationEvent> findByEventKey(String eventKey);
}

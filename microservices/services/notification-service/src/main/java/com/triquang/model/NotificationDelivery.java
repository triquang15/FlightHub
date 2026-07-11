package com.triquang.model;

import java.time.LocalDateTime;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "notification_deliveries",
        uniqueConstraints = @UniqueConstraint(name = "uk_notification_delivery_key", columnNames = "delivery_key")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private NotificationEvent event;

    @Column(name = "delivery_key", nullable = false, length = 260)
    private String deliveryKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DeliveryStatus status;

    @Column(nullable = false, length = 260)
    private String recipient;

    @Column(length = 260)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package com.triquang.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;
import com.triquang.model.NotificationDelivery;
import com.triquang.model.NotificationEvent;
import com.triquang.repository.NotificationDeliveryRepository;
import com.triquang.repository.NotificationEventRepository;

@ExtendWith(MockitoExtension.class)
class NotificationTrackingServiceTest {

    @Mock
    private NotificationEventRepository eventRepository;
    @Mock
    private NotificationDeliveryRepository deliveryRepository;
    @Mock
    private NotificationTrackingService.NotificationSender sender;

    private NotificationTrackingService service;
    private NotificationDelivery delivery;

    @BeforeEach
    void setUp() {
        service = new NotificationTrackingService(eventRepository, deliveryRepository, new ObjectMapper());
        NotificationEvent event = NotificationEvent.builder()
                .id(1L)
                .eventKey("BOOKING_CONFIRMED:BK-1")
                .type(NotificationType.BOOKING_CONFIRMED)
                .businessKey("BK-1")
                .sourceService("booking-service")
                .build();
        delivery = NotificationDelivery.builder()
                .id(2L)
                .event(event)
                .deliveryKey("BOOKING_CONFIRMED:BK-1:EMAIL:user@example.com")
                .channel(DeliveryChannel.EMAIL)
                .recipient("user@example.com")
                .status(DeliveryStatus.PENDING)
                .attempts(0)
                .build();

        when(eventRepository.findByEventKey(event.getEventKey())).thenReturn(Optional.of(event));
        when(deliveryRepository.findByDeliveryKey(delivery.getDeliveryKey())).thenReturn(Optional.of(delivery));
        lenient().when(deliveryRepository.saveAndFlush(any(NotificationDelivery.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void marksDeliverySentAfterProviderSuccess() throws Exception {
        sendTracked();

        assertEquals(DeliveryStatus.SENT, delivery.getStatus());
        assertEquals(1, delivery.getAttempts());
        verify(sender).send();
        verify(deliveryRepository, times(2)).saveAndFlush(delivery);
    }

    @Test
    void preservesFailedStateAndRethrowsProviderError() throws Exception {
        org.mockito.Mockito.doThrow(new IllegalStateException("provider unavailable"))
                .when(sender).send();

        assertThrows(IllegalStateException.class, this::sendTracked);

        assertEquals(DeliveryStatus.FAILED, delivery.getStatus());
        assertEquals("provider unavailable", delivery.getLastError());
        assertEquals(1, delivery.getAttempts());
        verify(deliveryRepository, times(2)).saveAndFlush(delivery);
    }

    @Test
    void doesNotSendAlreadyCompletedDelivery() throws Exception {
        delivery.setStatus(DeliveryStatus.SENT);

        sendTracked();

        verify(sender, never()).send();
        verify(deliveryRepository, never()).saveAndFlush(any());
    }

    private void sendTracked() throws Exception {
        service.sendTracked(
                NotificationType.BOOKING_CONFIRMED,
                "BK-1",
                DeliveryChannel.EMAIL,
                "user@example.com",
                "Confirmed",
                "Content",
                new Object(),
                sender
        );
    }
}

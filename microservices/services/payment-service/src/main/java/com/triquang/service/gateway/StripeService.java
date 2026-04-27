package com.triquang.service.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.model.Payment;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class StripeService {

    @Value("${payment.stripe.secret-key}")
    private String stripeKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
    }

    public String createCheckoutSession(Payment payment, UserDTO user) {

        try {

            SessionCreateParams params =
                    SessionCreateParams.builder()
                            .setMode(SessionCreateParams.Mode.PAYMENT)
                            .setSuccessUrl("http://localhost:3000/payment-success")
                            .setCancelUrl("http://localhost:3000/payment-cancel")
                            .addLineItem(
                                    SessionCreateParams.LineItem.builder()
                                            .setQuantity(1L)
                                            .setPriceData(
                                                    SessionCreateParams.LineItem.PriceData.builder()
                                                            .setCurrency("usd")
                                                            .setUnitAmount((long) (payment.getAmount() * 100))
                                                            .setProductData(
                                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                            .setName("Booking " + payment.getBookingId())
                                                                            .build()
                                                            )
                                                            .build()
                                            )
                                            .build()
                            )
                            .putMetadata("payment_id", String.valueOf(payment.getId()))
                            .build();

            Session session = Session.create(params);

            return session.getUrl();

        } catch (Exception e) {
            log.error("Stripe create session failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public boolean verifyPayment(String sessionId) {

        try {
            Session session = Session.retrieve(sessionId);

            return "paid".equalsIgnoreCase(session.getPaymentStatus());

        } catch (Exception e) {
            log.error("Stripe verify failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
}

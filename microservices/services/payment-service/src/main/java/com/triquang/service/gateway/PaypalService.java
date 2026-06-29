package com.triquang.service.gateway;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.model.Payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaypalService {

    @Value("${payment.paypal.client-id}")
    private String clientId;

    @Value("${payment.paypal.client-secret}")
    private String clientSecret;

    @Value("${payment.paypal.base-url}")
    private String baseUrl;

    @Value("${payment.paypal.webhook-id:}")
    private String webhookId;

    @Value("${payment.checkout.success-url}")
    private String successUrl;

    @Value("${payment.checkout.cancel-url}")
    private String cancelUrl;

    private String getAccessToken() {

        try {
            String auth = Base64.getEncoder()
                    .encodeToString((clientId + ":" + clientSecret).getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Basic " + auth);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> entity =
                    new HttpEntity<>("grant_type=client_credentials", headers);

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v1/oauth2/token",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return (String) response.getBody().get("access_token");

        } catch (Exception e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public PaymentCheckoutResult createPayment(Payment payment, UserDTO user) {

        try {
            String token = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("PayPal-Request-Id", "checkout-" + payment.getTransactionId());

            Map<String, Object> body = Map.of(
                    "intent", "CAPTURE",
                    "purchase_units", List.of(
                            Map.of(
                                    "amount", Map.of(
                                            "currency_code", payment.getCurrency(),
                                            "value", money(payment.getAmount())
                                    ),
                                    "custom_id", payment.getId().toString()
                            )
                    ),
                    "application_context", Map.of(
                            "return_url", successUrl(payment),
                            "cancel_url", cancelUrl(payment)
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            List<Map<String, String>> links =
                    (List<Map<String, String>>) responseBody.get("links");

            String checkoutUrl = links.stream()
                    .filter(l -> "approve".equals(l.get("rel")))
                    .findFirst()
                    .map(l -> l.get("href"))
                    .orElseThrow();
            return new PaymentCheckoutResult(checkoutUrl, stringValue(responseBody.get("id")));

        } catch (Exception e) {
            log.error("Paypal create failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public PaymentVerificationResult verifyPayment(String orderId) {

        try {
            String token = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("PayPal-Request-Id", "capture-" + orderId);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of(), headers);

            RestTemplate restTemplate = new RestTemplate();

            Map<String, Object> order = getOrder(orderId, token);

            if (order != null && "APPROVED".equalsIgnoreCase(stringValue(order.get("status")))) {
                order = restTemplate.exchange(
                        baseUrl + "/v2/checkout/orders/" + orderId + "/capture",
                        HttpMethod.POST, entity, Map.class).getBody();
            }

            return toVerificationResult(order, orderId);

        } catch (Exception e) {
            log.error("Paypal verify failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public PaymentVerificationResult inspectPayment(String orderId) {
        try {
            return toVerificationResult(getOrder(orderId, getAccessToken()), orderId);
        } catch (Exception e) {
            log.error("Paypal inspect failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public ProviderWebhookEvent parseWebhook(Map<String, String> headers, Map<String, Object> event) {
        try {
            verifyWebhookSignature(headers, event);
            String eventType = stringValue(event.get("event_type"));
            String eventId = stringValue(event.get("id"));
            Map<String, Object> resource = mapValue(event.get("resource"));
            String orderId = findOrderId(resource);

            PaymentVerificationResult verification = orderId == null ? null : inspectPayment(orderId);
            boolean terminalFailure = "PAYMENT.CAPTURE.DENIED".equals(eventType)
                    || "CHECKOUT.PAYMENT-APPROVAL.REVERSED".equals(eventType);
            return new ProviderWebhookEvent(eventId, eventType,
                    com.triquang.enums.PaymentGateway.PAYPAL, verification, terminalFailure);
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.warn("PayPal webhook validation failed: {}", e.getMessage());
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    public String refund(String captureId, String idempotencyKey) {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("PayPal-Request-Id", idempotencyKey);
            ResponseEntity<Map> response = new RestTemplate().exchange(
                    baseUrl + "/v2/payments/captures/" + captureId + "/refund",
                    HttpMethod.POST, new HttpEntity<>(Map.of(), headers), Map.class);
            return stringValue(response.getBody().get("id"));
        } catch (Exception e) {
            log.error("PayPal refund failed for capture {}", captureId, e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    @SuppressWarnings("unchecked")
    private PaymentVerificationResult toVerificationResult(Map<String, Object> order, String orderId) {
        if (order == null) {
            return new PaymentVerificationResult(false, orderId, null, null, null, null);
        }

        List<Map<String, Object>> purchaseUnits = (List<Map<String, Object>>) order.get("purchase_units");
        Map<String, Object> unit = purchaseUnits == null || purchaseUnits.isEmpty() ? Map.of() : purchaseUnits.get(0);
        Map<String, Object> amount = (Map<String, Object>) unit.get("amount");
        Map<String, Object> payments = mapValue(unit.get("payments"));
        List<Map<String, Object>> captures = listOfMaps(payments.get("captures"));
        Map<String, Object> capture = captures.isEmpty() ? Map.of() : captures.get(0);

        return new PaymentVerificationResult(
                "COMPLETED".equalsIgnoreCase(stringValue(order.get("status"))),
                orderId,
                stringValue(capture.get("id")),
                parseLong(stringValue(unit.get("custom_id"))),
                parseDecimal(amount == null ? null : stringValue(amount.get("value"))),
                amount == null ? null : stringValue(amount.get("currency_code")));
    }

    private Map<String, Object> getOrder(String orderId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new RestTemplate().exchange(
                baseUrl + "/v2/checkout/orders/" + orderId,
                HttpMethod.GET, new HttpEntity<Void>(headers), Map.class).getBody();
    }

    private void verifyWebhookSignature(Map<String, String> headers, Map<String, Object> event) {
        String transmissionId = header(headers, "paypal-transmission-id");
        String transmissionTime = header(headers, "paypal-transmission-time");
        String transmissionSignature = header(headers, "paypal-transmission-sig");
        String certUrl = header(headers, "paypal-cert-url");
        String authAlgo = header(headers, "paypal-auth-algo");
        if (webhookId.isBlank() || transmissionId == null || transmissionTime == null
                || transmissionSignature == null || certUrl == null || authAlgo == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("transmission_id", transmissionId);
        body.put("transmission_time", transmissionTime);
        body.put("cert_url", certUrl);
        body.put("auth_algo", authAlgo);
        body.put("transmission_sig", transmissionSignature);
        body.put("webhook_id", webhookId);
        body.put("webhook_event", event);

        HttpHeaders requestHeaders = new HttpHeaders();
        requestHeaders.setBearerAuth(getAccessToken());
        requestHeaders.setContentType(MediaType.APPLICATION_JSON);
        Map response = new RestTemplate().exchange(
                baseUrl + "/v1/notifications/verify-webhook-signature",
                HttpMethod.POST, new HttpEntity<>(body, requestHeaders), Map.class).getBody();
        if (response == null || !"SUCCESS".equals(response.get("verification_status"))) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private String findOrderId(Map<String, Object> resource) {
        Map<String, Object> supplementaryData = mapValue(resource.get("supplementary_data"));
        Map<String, Object> relatedIds = mapValue(supplementaryData.get("related_ids"));
        String orderId = stringValue(relatedIds.get("order_id"));
        return orderId != null ? orderId : stringValue(resource.get("id"));
    }

    private String header(Map<String, String> headers, String expectedName) {
        return headers.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(expectedName))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listOfMaps(Object value) {
        return value instanceof List<?> ? (List<Map<String, Object>>) value : List.of();
    }

    private String money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String successUrl(Payment payment) {
        return successUrl.replace("{bookingId}", payment.getBookingId().toString())
                + "?paymentId=" + payment.getId();
    }

    private String cancelUrl(Payment payment) {
        return cancelUrl.replace("{bookingId}", payment.getBookingId().toString());
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private Long parseLong(String value) {
        try {
            return value == null ? null : Long.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private BigDecimal parseDecimal(String value) {
        try {
            return value == null ? null : new BigDecimal(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}

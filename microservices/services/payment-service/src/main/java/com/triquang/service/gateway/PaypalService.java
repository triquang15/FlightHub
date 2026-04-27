package com.triquang.service.gateway;

import java.util.Base64;
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

    public String createPayment(Payment payment, UserDTO user) {

        try {
            String token = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "intent", "CAPTURE",
                    "purchase_units", List.of(
                            Map.of(
                                    "amount", Map.of(
                                            "currency_code", "USD",
                                            "value", payment.getAmount().toString()
                                    ),
                                    "custom_id", payment.getId().toString()
                            )
                    ),
                    "application_context", Map.of(
                            "return_url", "http://localhost:3000/payment-success",
                            "cancel_url", "http://localhost:3000/payment-cancel"
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

            List<Map<String, String>> links =
                    (List<Map<String, String>>) response.getBody().get("links");

            return links.stream()
                    .filter(l -> "approve".equals(l.get("rel")))
                    .findFirst()
                    .map(l -> l.get("href"))
                    .orElseThrow();

        } catch (Exception e) {
            log.error("Paypal create failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public boolean verifyPayment(String orderId) {

        try {
            String token = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders/" + orderId + "/capture",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            String status = (String) response.getBody().get("status");

            return "COMPLETED".equalsIgnoreCase(status);

        } catch (Exception e) {
            log.error("Paypal verify failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
}

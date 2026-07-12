package com.triquang.service;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AppleIdentityService {

    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private static final String APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String clientId;

    public AppleIdentityService(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.oauth.apple.client-id:}") String clientId
    ) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.clientId = clientId;
    }

    public AppleIdentity verify(String idToken, String requestedFullName) {
        if (!StringUtils.hasText(clientId)) {
            log.warn("Apple login attempted while APPLE_CLIENT_ID is not configured");
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        AppleTokenHeader header = readHeader(idToken);
        AppleKey key = findAppleKey(header.kid(), header.alg());
        PublicKey publicKey = toPublicKey(key);

        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .requireIssuer(APPLE_ISSUER)
                    .requireAudience(clientId)
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();
        } catch (Exception ex) {
            log.warn("Apple token verification failed: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        String subject = claims.getSubject();
        if (!StringUtils.hasText(subject)) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (claims.getExpiration() == null || claims.getExpiration().toInstant().isBefore(Instant.now())) {
            throw new BaseException(ErrorCode.TOKEN_EXPIRED);
        }

        String email = normalizeEmail(claims.get("email", String.class));
        if (StringUtils.hasText(email) && !isEmailVerified(claims.get("email_verified"))) {
            throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        return new AppleIdentity(
                subject,
                email,
                trimToNull(requestedFullName)
        );
    }

    private AppleTokenHeader readHeader(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Malformed JWT");
            }

            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            AppleTokenHeader header = objectMapper.readValue(headerJson, AppleTokenHeader.class);

            if (!StringUtils.hasText(header.kid()) || !StringUtils.hasText(header.alg())) {
                throw new IllegalArgumentException("Missing Apple JWT header fields");
            }

            return header;
        } catch (Exception ex) {
            log.warn("Could not read Apple token header: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }
    }

    private AppleKey findAppleKey(String kid, String alg) {
        AppleKeys keys;
        try {
            keys = restClient.get()
                    .uri(APPLE_KEYS_URL)
                    .retrieve()
                    .body(AppleKeys.class);
        } catch (Exception ex) {
            log.warn("Could not fetch Apple public keys: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (keys == null || keys.keys() == null) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        return keys.keys().stream()
                .filter(key -> kid.equals(key.kid()) && alg.equals(key.alg()))
                .findFirst()
                .orElseThrow(() -> new BaseException(ErrorCode.INVALID_TOKEN));
    }

    private PublicKey toPublicKey(AppleKey key) {
        try {
            BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(key.n()));
            BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(key.e()));
            return KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(modulus, exponent));
        } catch (Exception ex) {
            log.warn("Could not build Apple public key: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }
    }

    private boolean isEmailVerified(Object value) {
        if (value instanceof Boolean verified) {
            return verified;
        }
        return "true".equalsIgnoreCase(String.valueOf(value));
    }

    private String normalizeEmail(String email) {
        return StringUtils.hasText(email) ? email.trim().toLowerCase() : null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record AppleIdentity(String subject, String email, String fullName) {}

    private record AppleTokenHeader(String kid, String alg) {}

    private record AppleKeys(List<AppleKey> keys) {}

    private record AppleKey(
            String kty,
            String kid,
            String use,
            String alg,
            String n,
            String e,
            @JsonProperty("x5c") List<String> x5c
    ) {}
}

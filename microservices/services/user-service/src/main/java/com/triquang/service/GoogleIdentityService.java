package com.triquang.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GoogleIdentityService {

    private final RestClient restClient;
    private final String clientId;

    public GoogleIdentityService(
            RestClient.Builder restClientBuilder,
            @Value("${app.oauth.google.client-id:}") String clientId
    ) {
        this.restClient = restClientBuilder.build();
        this.clientId = clientId;
    }

    public GoogleIdentity verify(String idToken) {
        if (!StringUtils.hasText(clientId)) {
            log.warn("Google login attempted while GOOGLE_CLIENT_ID is not configured");
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        GoogleTokenInfo tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("oauth2.googleapis.com")
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (Exception ex) {
            log.warn("Google token verification failed: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (tokenInfo == null || !clientId.equals(tokenInfo.aud())) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (!"true".equalsIgnoreCase(tokenInfo.email_verified())) {
            throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        if (tokenInfo.exp() != null && tokenInfo.exp() < Instant.now().getEpochSecond()) {
            throw new BaseException(ErrorCode.TOKEN_EXPIRED);
        }

        if (!StringUtils.hasText(tokenInfo.sub()) || !StringUtils.hasText(tokenInfo.email())) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        return new GoogleIdentity(
                tokenInfo.sub(),
                tokenInfo.email().trim().toLowerCase(),
                tokenInfo.name(),
                tokenInfo.picture()
        );
    }

    public record GoogleIdentity(String subject, String email, String name, String picture) {}

    private record GoogleTokenInfo(
            String sub,
            String aud,
            String email,
            String email_verified,
            String name,
            String picture,
            Long exp
    ) {}
}

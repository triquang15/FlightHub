package com.triquang.service;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FacebookIdentityService {

    private static final String GRAPH_HOST = "graph.facebook.com";
    private static final String GRAPH_VERSION = "v20.0";

    private final RestClient restClient;
    private final String appId;
    private final String appSecret;

    public FacebookIdentityService(
            RestClient.Builder restClientBuilder,
            @Value("${app.oauth.facebook.app-id:}") String appId,
            @Value("${app.oauth.facebook.app-secret:}") String appSecret
    ) {
        this.restClient = restClientBuilder.build();
        this.appId = appId;
        this.appSecret = appSecret;
    }

    public FacebookIdentity verify(String accessToken) {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            log.warn("Facebook login attempted while FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is not configured");
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        String appAccessToken = appId + "|" + appSecret;
        FacebookDebugResponse debugResponse;
        try {
            debugResponse = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host(GRAPH_HOST)
                            .path("/" + GRAPH_VERSION + "/debug_token")
                            .queryParam("input_token", accessToken)
                            .queryParam("access_token", appAccessToken)
                            .build())
                    .retrieve()
                    .body(FacebookDebugResponse.class);
        } catch (Exception ex) {
            log.warn("Facebook token debug failed: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        FacebookDebugData debugData = debugResponse == null ? null : debugResponse.data();
        if (debugData == null || !Boolean.TRUE.equals(debugData.is_valid())) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (!Objects.equals(appId, debugData.app_id())) {
            log.warn("Facebook token app mismatch expected={} actual={}", appId, debugData.app_id());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (!StringUtils.hasText(debugData.user_id())) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        FacebookProfile profile;
        try {
            profile = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host(GRAPH_HOST)
                            .path("/" + GRAPH_VERSION + "/me")
                            .queryParam("fields", "id,name,email,picture.type(large)")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .body(FacebookProfile.class);
        } catch (Exception ex) {
            log.warn("Facebook profile fetch failed: {}", ex.getMessage());
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (profile == null || !debugData.user_id().equals(profile.id()) || !StringUtils.hasText(profile.email())) {
            throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        return new FacebookIdentity(
                profile.id(),
                profile.email().trim().toLowerCase(),
                profile.name(),
                profile.pictureUrl()
        );
    }

    public record FacebookIdentity(String subject, String email, String name, String picture) {}

    private record FacebookDebugResponse(FacebookDebugData data) {}

    private record FacebookDebugData(Boolean is_valid, String app_id, String user_id) {}

    private record FacebookProfile(String id, String name, String email, FacebookPicture picture) {
        private String pictureUrl() {
            return picture == null || picture.data() == null ? null : picture.data().url();
        }
    }

    private record FacebookPicture(FacebookPictureData data) {}

    private record FacebookPictureData(String url) {}
}

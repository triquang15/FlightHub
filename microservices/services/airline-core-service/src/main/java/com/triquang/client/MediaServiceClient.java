package com.triquang.client;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.payload.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Component
@Slf4j
public class MediaServiceClient {

    private static final long MAX_LOGO_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_LOGO_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml"
    );

    private final RestClient restClient;

    public MediaServiceClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.media-service.base-url:http://localhost:8089}") String mediaServiceBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(mediaServiceBaseUrl == null ? "http://localhost:8089" : mediaServiceBaseUrl.replaceAll("/+$", ""))
                .build();
    }

    public MediaFileResponse uploadAirlineLogo(Long ownerUserId, Long airlineId, MultipartFile file) {
        validateLogo(file);

        try {
            String contentType = normalizeContentType(file.getContentType());
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("file", file.getResource())
                    .filename(StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "airline-logo")
                    .contentType(MediaType.parseMediaType(contentType));
            bodyBuilder.part("ownerUserId", ownerUserId);
            bodyBuilder.part("entityType", "AIRLINE");
            bodyBuilder.part("entityId", airlineId);
            bodyBuilder.part("purpose", "LOGO");
            bodyBuilder.part("visibility", "PUBLIC");

            ApiResponse<MediaFileResponse> response = restClient.post()
                    .uri("/api/media/upload")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(bodyBuilder.build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || response.data() == null || !StringUtils.hasText(response.data().publicUrl())) {
                throw new BaseException(ErrorCode.INTERNAL_ERROR);
            }

            return response.data();
        } catch (BaseException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to upload airline logo to media-service | airlineId={}", airlineId, ex);
            throw new BaseException(ErrorCode.INTERNAL_ERROR);
        }
    }

    public void deleteByStorageKey(String storageKey) {
        if (!StringUtils.hasText(storageKey)) {
            return;
        }

        try {
            restClient.delete()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/media/storage-key")
                            .queryParam("storageKey", storageKey)
                            .build())
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Failed to delete media file by storageKey={}", storageKey, ex);
        }
    }

    private void validateLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_LOGO_BYTES) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (!ALLOWED_LOGO_CONTENT_TYPES.contains(normalizeContentType(file.getContentType()))) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "application/octet-stream";
        }
        return contentType.toLowerCase(Locale.ROOT).trim();
    }

    public record MediaFileResponse(
            Long id,
            Long ownerUserId,
            String entityType,
            Long entityId,
            String purpose,
            String originalFileName,
            String contentType,
            Long sizeBytes,
            String storageProvider,
            String storageKey,
            String publicUrl,
            String visibility,
            String checksumSha256,
            Instant createdAt,
            Instant updatedAt
    ) {}
}

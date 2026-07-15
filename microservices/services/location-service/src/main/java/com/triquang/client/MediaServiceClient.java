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

    private static final long MAX_AIRPORT_HERO_BYTES = 8L * 1024L * 1024L;
    private static final Set<String> ALLOWED_AIRPORT_HERO_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
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

    public MediaFileResponse uploadAirportHeroImage(Long airportId, MultipartFile file) {
        validateAirportHero(file);

        try {
            String contentType = normalizeContentType(file.getContentType());
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("file", file.getResource())
                    .filename(StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "airport-hero")
                    .contentType(MediaType.parseMediaType(contentType));
            bodyBuilder.part("entityType", "AIRPORT");
            bodyBuilder.part("entityId", airportId);
            bodyBuilder.part("purpose", "HERO");
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
            log.error("Failed to upload airport hero image to media-service | airportId={}", airportId, ex);
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

    private void validateAirportHero(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_AIRPORT_HERO_BYTES) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (!ALLOWED_AIRPORT_HERO_CONTENT_TYPES.contains(normalizeContentType(file.getContentType()))) {
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

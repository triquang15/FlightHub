package com.triquang.payload;

import com.triquang.model.MediaVisibility;
import com.triquang.model.StorageProvider;

import java.time.Instant;

public record MediaFileResponse(
        Long id,
        Long ownerUserId,
        String entityType,
        Long entityId,
        String purpose,
        String originalFileName,
        String contentType,
        Long sizeBytes,
        StorageProvider storageProvider,
        String storageKey,
        String publicUrl,
        MediaVisibility visibility,
        String checksumSha256,
        Instant createdAt,
        Instant updatedAt
) {
}

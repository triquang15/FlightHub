package com.triquang.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    StoredMedia store(MultipartFile file, String entityType, String purpose);

    record StoredMedia(
            String storageKey,
            String publicUrl,
            String checksumSha256,
            long sizeBytes,
            String contentType,
            String originalFileName
    ) {
    }
}

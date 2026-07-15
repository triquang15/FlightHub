package com.triquang.service;

import com.triquang.model.StorageProvider;
import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    StorageProvider provider();

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

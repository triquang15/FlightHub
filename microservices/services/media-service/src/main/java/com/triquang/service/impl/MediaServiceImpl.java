package com.triquang.service.impl;

import com.triquang.mapper.MediaFileMapper;
import com.triquang.model.MediaFile;
import com.triquang.model.MediaVisibility;
import com.triquang.model.StorageProvider;
import com.triquang.payload.MediaFileResponse;
import com.triquang.repository.MediaFileRepository;
import com.triquang.service.MediaService;
import com.triquang.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

    private final MediaFileRepository mediaFileRepository;
    private final MediaStorageService mediaStorageService;

    @Value("${app.media.storage-path:uploads/media}")
    private String storagePath;

    @Override
    @Transactional
    public MediaFileResponse upload(
            MultipartFile file,
            Long ownerUserId,
            String entityType,
            Long entityId,
            String purpose,
            MediaVisibility visibility
    ) {
        String normalizedEntityType = normalizeRequired(entityType, "entityType");
        String normalizedPurpose = normalizeRequired(purpose, "purpose");
        MediaVisibility resolvedVisibility = visibility == null ? MediaVisibility.PUBLIC : visibility;
        MediaStorageService.StoredMedia stored = mediaStorageService.store(file, normalizedEntityType, normalizedPurpose);

        MediaFile mediaFile = MediaFile.builder()
                .ownerUserId(ownerUserId)
                .entityType(normalizedEntityType)
                .entityId(entityId)
                .purpose(normalizedPurpose)
                .originalFileName(stored.originalFileName())
                .contentType(stored.contentType())
                .sizeBytes(stored.sizeBytes())
                .storageProvider(StorageProvider.LOCAL)
                .storageKey(stored.storageKey())
                .publicUrl(stored.publicUrl())
                .visibility(resolvedVisibility)
                .checksumSha256(stored.checksumSha256())
                .build();

        return MediaFileMapper.toResponse(mediaFileRepository.save(mediaFile));
    }

    @Override
    @Transactional(readOnly = true)
    public MediaFileResponse getById(Long id) {
        return mediaFileRepository.findById(id)
                .map(MediaFileMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Media file not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MediaFileResponse> getByEntity(String entityType, Long entityId, String purpose) {
        return mediaFileRepository
                .findByEntityTypeAndEntityIdAndPurposeOrderByCreatedAtDesc(
                        normalizeRequired(entityType, "entityType"),
                        entityId,
                        normalizeRequired(purpose, "purpose")
                )
                .stream()
                .map(MediaFileMapper::toResponse)
                .toList();
    }

    @Override
    public Resource getFile(String storageKey) {
        try {
            Path root = Path.of(storagePath).toAbsolutePath().normalize();
            Path file = root.resolve(storageKey).normalize();
            if (!file.startsWith(root)) {
                throw new IllegalArgumentException("Invalid media file path");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Media file not found");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new IllegalArgumentException("Invalid media file path", ex);
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Media file not found"));
        Path root = Path.of(storagePath).toAbsolutePath().normalize();
        Path file = root.resolve(mediaFile.getStorageKey()).normalize();
        try {
            if (file.startsWith(root)) {
                Files.deleteIfExists(file);
            }
        } catch (Exception ignored) {
            // Metadata deletion should still succeed; storage cleanup can be retried from logs/jobs later.
        }
        mediaFileRepository.delete(mediaFile);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}

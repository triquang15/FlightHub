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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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
    public Page<MediaFileResponse> search(
            String entityType,
            String purpose,
            Long ownerUserId,
            String keyword,
            Pageable pageable
    ) {
        Specification<MediaFile> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (StringUtils.hasText(entityType)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("entityType"), entityType.trim().toUpperCase(Locale.ROOT)));
        }

        if (StringUtils.hasText(purpose)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("purpose"), purpose.trim().toUpperCase(Locale.ROOT)));
        }

        if (ownerUserId != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("ownerUserId"), ownerUserId));
        }

        if (StringUtils.hasText(keyword)) {
            String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("originalFileName")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("storageKey")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("contentType")), pattern)
                    ));
        }

        return mediaFileRepository.findAll(specification, pageable)
                .map(MediaFileMapper::toResponse);
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
        String normalizedStorageKey = requireStorageKey(storageKey);
        try {
            Path root = Path.of(storagePath).toAbsolutePath().normalize();
            Path file = root.resolve(normalizedStorageKey).normalize();
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
        deletePhysicalFile(mediaFile.getStorageKey());
        mediaFileRepository.delete(mediaFile);
    }

    @Override
    @Transactional
    public void deleteByStorageKey(String storageKey) {
        MediaFile mediaFile = mediaFileRepository.findByStorageKey(requireStorageKey(storageKey))
                .orElseThrow(() -> new IllegalArgumentException("Media file not found"));
        deletePhysicalFile(mediaFile.getStorageKey());
        mediaFileRepository.delete(mediaFile);
    }

    private void deletePhysicalFile(String storageKey) {
        Path root = Path.of(storagePath).toAbsolutePath().normalize();
        Path file = root.resolve(storageKey).normalize();
        try {
            if (file.startsWith(root)) {
                Files.deleteIfExists(file);
            }
        } catch (Exception ignored) {
            // Metadata deletion should still succeed; storage cleanup can be retried from logs/jobs later.
        }
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String requireStorageKey(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new IllegalArgumentException("storageKey is required");
        }
        return storageKey.trim();
    }
}

package com.triquang.service.impl;

import com.triquang.mapper.MediaFileMapper;
import com.triquang.model.MediaEntityType;
import com.triquang.model.MediaFile;
import com.triquang.model.MediaPurpose;
import com.triquang.model.MediaVisibility;
import com.triquang.payload.MediaFileResponse;
import com.triquang.repository.MediaFileRepository;
import com.triquang.service.MediaService;
import com.triquang.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaServiceImpl implements MediaService {

    private static final long MB = 1024L * 1024L;
    private static final long SMALL_IMAGE_MAX_BYTES = 5L * MB;
    private static final long LARGE_IMAGE_MAX_BYTES = 8L * MB;
    private static final Set<String> STANDARD_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> BRAND_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/svg+xml");

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
        MediaEntityType normalizedEntityType = MediaEntityType.from(entityType);
        MediaPurpose normalizedPurpose = MediaPurpose.from(purpose);
        validateUploadPolicy(file, normalizedEntityType, normalizedPurpose, entityId);
        MediaVisibility resolvedVisibility = visibility == null ? MediaVisibility.PUBLIC : visibility;
        MediaStorageService.StoredMedia stored = mediaStorageService.store(
                file,
                normalizedEntityType.name(),
                normalizedPurpose.name()
        );

        MediaFile mediaFile = MediaFile.builder()
                .ownerUserId(ownerUserId)
                .entityType(normalizedEntityType.name())
                .entityId(entityId)
                .purpose(normalizedPurpose.name())
                .originalFileName(stored.originalFileName())
                .contentType(stored.contentType())
                .sizeBytes(stored.sizeBytes())
                .storageProvider(mediaStorageService.provider())
                .storageKey(stored.storageKey())
                .publicUrl(stored.publicUrl())
                .visibility(resolvedVisibility)
                .checksumSha256(stored.checksumSha256())
                .build();

        MediaFile saved = mediaFileRepository.save(mediaFile);
        log.info(
                "Media uploaded id={} entityType={} entityId={} purpose={} ownerUserId={} sizeBytes={} provider={} storageKey={}",
                saved.getId(),
                saved.getEntityType(),
                saved.getEntityId(),
                saved.getPurpose(),
                saved.getOwnerUserId(),
                saved.getSizeBytes(),
                saved.getStorageProvider(),
                saved.getStorageKey()
        );
        return MediaFileMapper.toResponse(saved);
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
        String normalizedEntityType = StringUtils.hasText(entityType) ? MediaEntityType.from(entityType).name() : null;
        String normalizedPurpose = StringUtils.hasText(purpose) ? MediaPurpose.from(purpose).name() : null;

        if (normalizedEntityType != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("entityType"), normalizedEntityType));
        }

        if (normalizedPurpose != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("purpose"), normalizedPurpose));
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
                        MediaEntityType.from(entityType).name(),
                        entityId,
                        MediaPurpose.from(purpose).name()
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
    public void delete(Long id, boolean force) {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Media file not found"));
        if (!force && isLinkedBusinessAsset(mediaFile)) {
            throw new IllegalArgumentException("Linked media requires force=true to delete");
        }
        deletePhysicalFile(mediaFile.getStorageKey());
        mediaFileRepository.delete(mediaFile);
        log.info(
                "Media deleted id={} force={} entityType={} entityId={} purpose={} storageKey={}",
                id,
                force,
                mediaFile.getEntityType(),
                mediaFile.getEntityId(),
                mediaFile.getPurpose(),
                mediaFile.getStorageKey()
        );
    }

    @Override
    @Transactional
    public void deleteByStorageKey(String storageKey) {
        MediaFile mediaFile = mediaFileRepository.findByStorageKey(requireStorageKey(storageKey))
                .orElseThrow(() -> new IllegalArgumentException("Media file not found"));
        deletePhysicalFile(mediaFile.getStorageKey());
        mediaFileRepository.delete(mediaFile);
        log.info(
                "Media deleted by storageKey entityType={} entityId={} purpose={} storageKey={}",
                mediaFile.getEntityType(),
                mediaFile.getEntityId(),
                mediaFile.getPurpose(),
                mediaFile.getStorageKey()
        );
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

    private void validateUploadPolicy(
            MultipartFile file,
            MediaEntityType entityType,
            MediaPurpose purpose,
            Long entityId
    ) {
        UploadPolicy policy = resolvePolicy(entityType, purpose);
        if (policy.entityIdRequired() && entityId == null) {
            throw new IllegalArgumentException("entityId is required for " + entityType + " " + purpose);
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > policy.maxBytes()) {
            throw new IllegalArgumentException("File exceeds " + policy.maxBytes() / MB + "MB limit for " + purpose);
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!policy.contentTypes().contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type for " + entityType + " " + purpose);
        }
    }

    private UploadPolicy resolvePolicy(MediaEntityType entityType, MediaPurpose purpose) {
        return switch (entityType) {
            case USER_PROFILE -> requirePolicy(entityType, purpose, MediaPurpose.AVATAR, SMALL_IMAGE_MAX_BYTES, STANDARD_IMAGE_TYPES, true);
            case AIRLINE -> requirePolicy(entityType, purpose, MediaPurpose.LOGO, SMALL_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES, true);
            case MEAL -> requirePolicy(entityType, purpose, MediaPurpose.IMAGE, LARGE_IMAGE_MAX_BYTES, STANDARD_IMAGE_TYPES, true);
            case ANCILLARY -> requirePolicy(entityType, purpose, MediaPurpose.ICON, SMALL_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES, true);
            case AIRPORT -> requirePolicy(entityType, purpose, MediaPurpose.HERO, LARGE_IMAGE_MAX_BYTES, STANDARD_IMAGE_TYPES, true);
            case ROUTE -> requirePolicy(entityType, purpose, MediaPurpose.HERO, LARGE_IMAGE_MAX_BYTES, STANDARD_IMAGE_TYPES, true);
            case LANDING -> requirePolicy(entityType, purpose, MediaPurpose.HERO, LARGE_IMAGE_MAX_BYTES, STANDARD_IMAGE_TYPES, false);
        };
    }

    private UploadPolicy requirePolicy(
            MediaEntityType entityType,
            MediaPurpose actualPurpose,
            MediaPurpose expectedPurpose,
            long maxBytes,
            Set<String> contentTypes,
            boolean entityIdRequired
    ) {
        if (actualPurpose != expectedPurpose) {
            throw new IllegalArgumentException(entityType + " media only supports purpose " + expectedPurpose);
        }
        return new UploadPolicy(maxBytes, contentTypes, entityIdRequired);
    }

    private boolean isLinkedBusinessAsset(MediaFile mediaFile) {
        return mediaFile.getEntityId() != null && StringUtils.hasText(mediaFile.getEntityType());
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String requireStorageKey(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new IllegalArgumentException("storageKey is required");
        }
        return storageKey.trim();
    }

    private record UploadPolicy(long maxBytes, Set<String> contentTypes, boolean entityIdRequired) {
    }
}

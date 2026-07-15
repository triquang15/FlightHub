package com.triquang.service;

import com.triquang.model.StorageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.media", name = "storage-provider", havingValue = "LOCAL", matchIfMissing = true)
public class LocalMediaStorageService implements MediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "application/pdf"
    );

    @Value("${app.media.storage-path:uploads/media}")
    private String storagePath;

    @Value("${app.media.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    @Value("${app.media.max-file-size-bytes:8388608}")
    private long maxFileSizeBytes;

    @Override
    public StorageProvider provider() {
        return StorageProvider.LOCAL;
    }

    @Override
    public StoredMedia store(MultipartFile file, String entityType, String purpose) {
        validate(file);

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalName);
        String normalizedEntity = normalizeSegment(entityType);
        String normalizedPurpose = normalizeSegment(purpose);
        String storageKey = "%s/%s/%s%s".formatted(
                normalizedEntity,
                normalizedPurpose,
                UUID.randomUUID(),
                extension
        );
        Path root = Path.of(storagePath).toAbsolutePath().normalize();
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage path");
        }

        try {
            Files.createDirectories(target.getParent());
            String checksum = copyAndChecksum(file, target);
            String publicUrl = publicBaseUrl.replaceAll("/+$", "") + "/api/media/file/" + storageKey;
            return new StoredMedia(
                    storageKey,
                    publicUrl,
                    checksum,
                    file.getSize(),
                    normalizeContentType(file.getContentType()),
                    originalName
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store media file", ex);
        }
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        try {
            Path root = Path.of(storagePath).toAbsolutePath().normalize();
            Path file = root.resolve(requireStorageKey(storageKey)).normalize();
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
    public void delete(String storageKey) {
        Path root = Path.of(storagePath).toAbsolutePath().normalize();
        Path file = root.resolve(requireStorageKey(storageKey)).normalize();
        try {
            if (file.startsWith(root)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to delete media file", ex);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("File exceeds max upload size");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type");
        }
    }

    private String copyAndChecksum(MultipartFile file, Path target) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = file.getInputStream();
                 DigestInputStream digestInput = new DigestInputStream(input, digest)) {
                Files.copy(digestInput, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 digest is unavailable", ex);
        }
    }

    private String sanitizeFileName(String fileName) {
        String clean = StringUtils.cleanPath(fileName == null ? "upload" : fileName);
        clean = clean.replaceAll("[^a-zA-Z0-9._-]", "-");
        return clean.isBlank() ? "upload" : clean;
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot).toLowerCase(Locale.ROOT);
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

    private String normalizeSegment(String value) {
        String normalized = value == null ? "general" : value.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9_-]", "-");
        return normalized.isBlank() ? "general" : normalized;
    }
}

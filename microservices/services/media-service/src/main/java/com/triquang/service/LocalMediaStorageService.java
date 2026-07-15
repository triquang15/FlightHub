package com.triquang.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
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
public class LocalMediaStorageService implements MediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf"
    );

    @Value("${app.media.storage-path:uploads/media}")
    private String storagePath;

    @Value("${app.media.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    @Value("${app.media.max-file-size-bytes:5242880}")
    private long maxFileSizeBytes;

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
                    file.getContentType(),
                    originalName
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store media file", ex);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("File exceeds max upload size");
        }
        String contentType = file.getContentType();
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

    private String normalizeSegment(String value) {
        String normalized = value == null ? "general" : value.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9_-]", "-");
        return normalized.isBlank() ? "general" : normalized;
    }
}

package com.triquang.service.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class LocalAvatarStorageService implements AvatarStorageService {

    private static final long MAX_AVATAR_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final Path rootDirectory;
    private final String publicBaseUrl;

    public LocalAvatarStorageService(
            @Value("${app.storage.avatar.local-dir:${java.io.tmpdir}/flighthub/avatars}") String localDir,
            @Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl) {
        this.rootDirectory = Path.of(localDir).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.replaceAll("/+$", "");
    }

    @Override
    public StoredAvatar store(Long userId, MultipartFile file) {
        validate(userId, file);

        String contentType = normalizeContentType(file.getContentType());
        String extension = EXTENSIONS.get(contentType);
        String filename = UUID.randomUUID() + "." + extension;
        String objectKey = "users/%d/avatar/%s".formatted(userId, filename);
        Path target = rootDirectory.resolve(objectKey).normalize();

        if (!target.startsWith(rootDirectory)) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        try {
            Files.createDirectories(target.getParent());
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            log.error("Could not store avatar for userId={}", userId, ex);
            throw new BaseException(ErrorCode.INTERNAL_ERROR);
        }

        String publicUrl = "%s/api/users/profile/avatar/file/%d/%s".formatted(this.publicBaseUrl, userId, filename);
        return new StoredAvatar(objectKey, publicUrl, contentType);
    }

    @Override
    public AvatarResource load(Long userId, String filename) {
        if (userId == null || !StringUtils.hasText(filename) || filename.contains("/") || filename.contains("\\")) {
            throw new BaseException(ErrorCode.NOT_FOUND);
        }

        Path target = rootDirectory.resolve("users/%d/avatar/%s".formatted(userId, filename)).normalize();
        if (!target.startsWith(rootDirectory) || !Files.exists(target)) {
            throw new BaseException(ErrorCode.NOT_FOUND);
        }

        try {
            Resource resource = new UrlResource(target.toUri());
            String contentType = Files.probeContentType(target);
            return new AvatarResource(resource, normalizeContentType(contentType));
        } catch (IOException ex) {
            log.error("Could not load avatar userId={} filename={}", userId, filename, ex);
            throw new BaseException(ErrorCode.INTERNAL_ERROR);
        }
    }

    @Override
    public void delete(String objectKey) {
        if (!StringUtils.hasText(objectKey)) {
            return;
        }

        Path target = rootDirectory.resolve(objectKey).normalize();
        if (!target.startsWith(rootDirectory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            log.warn("Could not delete avatar objectKey={}", objectKey, ex);
        }
    }

    private void validate(Long userId, MultipartFile file) {
        if (userId == null || file == null || file.isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (!ALLOWED_CONTENT_TYPES.contains(normalizeContentType(file.getContentType()))) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "application/octet-stream";
        }
        return contentType.toLowerCase(Locale.ROOT).trim();
    }
}

package com.triquang.service;

import com.triquang.model.StorageProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.io.IOException;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.media", name = "storage-provider", havingValue = "S3")
public class S3MediaStorageService implements MediaStorageService {

    @Value("${app.media.s3.bucket:}")
    private String bucket;

    @Value("${app.media.s3.region:us-east-1}")
    private String region;

    @Value("${app.media.s3.public-base-url:}")
    private String publicBaseUrl;

    @Value("${app.media.s3.endpoint:}")
    private String endpoint;

    @Value("${app.media.s3.path-style-access:false}")
    private boolean pathStyleAccess;

    @Value("${app.media.s3.access-key-id:}")
    private String accessKeyId;

    @Value("${app.media.s3.secret-access-key:}")
    private String secretAccessKey;

    @Value("${app.media.max-file-size-bytes:8388608}")
    private long maxFileSizeBytes;

    private S3Client s3Client;

    @PostConstruct
    void init() {
        if (!StringUtils.hasText(bucket)) {
            throw new IllegalStateException("MEDIA_S3_BUCKET is required when MEDIA_STORAGE_PROVIDER=S3");
        }
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(pathStyleAccess)
                        .build());

        if (StringUtils.hasText(endpoint)) {
            builder.endpointOverride(URI.create(endpoint.trim()));
        }

        this.s3Client = builder.build();
    }

    @Override
    public StorageProvider provider() {
        return StorageProvider.S3;
    }

    @Override
    public StoredMedia store(MultipartFile file, String entityType, String purpose) {
        validate(file);
        String originalName = sanitizeFileName(file.getOriginalFilename());
        String storageKey = "%s/%s/%s%s".formatted(
                normalizeSegment(entityType),
                normalizeSegment(purpose),
                UUID.randomUUID(),
                getExtension(originalName)
        );
        try {
            byte[] bytes = file.getBytes();
            String contentType = normalizeContentType(file.getContentType());
            String checksum = sha256(bytes);
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(storageKey)
                    .contentType(contentType)
                    .contentLength((long) bytes.length)
                    .build();
            s3Client.putObject(request, RequestBody.fromBytes(bytes));
            return new StoredMedia(
                    storageKey,
                    publicUrl(storageKey),
                    checksum,
                    bytes.length,
                    contentType,
                    originalName
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read media file", ex);
        }
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        String key = requireStorageKey(storageKey);
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();
        byte[] bytes = s3Client.getObjectAsBytes(request).asByteArray();
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return key.substring(key.lastIndexOf('/') + 1);
            }
        };
    }

    @Override
    public void delete(String storageKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(requireStorageKey(storageKey))
                .build());
    }

    private AwsCredentialsProvider credentialsProvider() {
        if (StringUtils.hasText(accessKeyId) && StringUtils.hasText(secretAccessKey)) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim()));
        }
        return DefaultCredentialsProvider.create();
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("File exceeds max upload size");
        }
    }

    private String publicUrl(String storageKey) {
        if (StringUtils.hasText(publicBaseUrl)) {
            return publicBaseUrl.replaceAll("/+$", "") + "/" + storageKey;
        }
        return "https://%s.s3.%s.amazonaws.com/%s".formatted(bucket, region, storageKey);
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
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

    private String normalizeSegment(String value) {
        String normalized = value == null ? "general" : value.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[^a-z0-9_-]", "-");
        return normalized.isBlank() ? "general" : normalized;
    }

    private String requireStorageKey(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new IllegalArgumentException("storageKey is required");
        }
        return storageKey.trim();
    }
}

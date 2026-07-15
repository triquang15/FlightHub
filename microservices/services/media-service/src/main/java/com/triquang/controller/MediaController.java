package com.triquang.controller;

import com.triquang.model.MediaVisibility;
import com.triquang.payload.MediaFileResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.MediaService;
import com.triquang.utils.ResponseUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private static final String FILE_ROUTE_PREFIX = "/api/media/file/";
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "createdAt", "updatedAt", "entityType", "purpose", "sizeBytes");

    private final MediaService mediaService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaFileResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Long gatewayUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles,
            @RequestParam(required = false) Long ownerUserId,
            @RequestParam String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam String purpose,
            @RequestParam(defaultValue = "PUBLIC") MediaVisibility visibility
    ) {
        return ResponseUtil.created(mediaService.upload(
                file,
                gatewayUserId,
                gatewayRoles,
                ownerUserId,
                entityType,
                entityId,
                purpose,
                visibility
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaFileResponse>> getById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long gatewayUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles
    ) {
        return ResponseUtil.ok(mediaService.getById(id, gatewayUserId, gatewayRoles));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MediaFileResponse>>> search(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String purpose,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) Long ownerUserId,
            @RequestParam(required = false) String keyword,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseUtil.ok(mediaService.search(
                entityType,
                purpose,
                provider,
                ownerUserId,
                keyword,
                gatewayRoles,
                pageable(page, size, sortBy, sortDirection)
        ));
    }

    @GetMapping("/entity/{entityType}/{entityId}/{purpose}")
    public ResponseEntity<ApiResponse<List<MediaFileResponse>>> getByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String purpose,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles
    ) {
        return ResponseUtil.ok(mediaService.getByEntity(entityType, entityId, purpose, gatewayRoles));
    }

    @GetMapping("/file/**")
    public ResponseEntity<Resource> getFile(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        int prefixIndex = requestUri.indexOf(FILE_ROUTE_PREFIX);
        String storageKey = prefixIndex >= 0
                ? requestUri.substring(prefixIndex + FILE_ROUTE_PREFIX.length())
                : "";
        Resource resource = mediaService.getFile(storageKey);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
                .contentType(MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        mediaService.delete(id, force, gatewayRoles);
        return ResponseUtil.noContent();
    }

    @DeleteMapping("/storage-key")
    public ResponseEntity<ApiResponse<Void>> deleteByStorageKey(
            @RequestParam String storageKey,
            @RequestHeader(value = "X-User-Roles", required = false) String gatewayRoles
    ) {
        mediaService.deleteByStorageKey(storageKey, gatewayRoles);
        return ResponseUtil.noContent();
    }

    private Pageable pageable(int page, int size, String sortBy, String sortDirection) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        String safeSort = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(safePage, safeSize, Sort.by(direction, safeSort));
    }
}

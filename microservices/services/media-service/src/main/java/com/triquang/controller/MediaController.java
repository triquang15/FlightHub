package com.triquang.controller;

import com.triquang.model.MediaVisibility;
import com.triquang.payload.MediaFileResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.MediaService;
import com.triquang.utils.ResponseUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private static final String FILE_ROUTE_PREFIX = "/api/media/file/";

    private final MediaService mediaService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaFileResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long ownerUserId,
            @RequestParam String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam String purpose,
            @RequestParam(defaultValue = "PUBLIC") MediaVisibility visibility
    ) {
        return ResponseUtil.created(mediaService.upload(file, ownerUserId, entityType, entityId, purpose, visibility));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaFileResponse>> getById(@PathVariable Long id) {
        return ResponseUtil.ok(mediaService.getById(id));
    }

    @GetMapping("/entity/{entityType}/{entityId}/{purpose}")
    public ResponseEntity<ApiResponse<List<MediaFileResponse>>> getByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String purpose
    ) {
        return ResponseUtil.ok(mediaService.getByEntity(entityType, entityId, purpose));
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
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        mediaService.delete(id);
        return ResponseUtil.noContent();
    }
}

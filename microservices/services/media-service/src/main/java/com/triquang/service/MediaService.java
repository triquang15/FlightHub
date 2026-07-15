package com.triquang.service;

import com.triquang.model.MediaVisibility;
import com.triquang.payload.MediaFileResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MediaService {

    MediaFileResponse upload(
            MultipartFile file,
            Long gatewayUserId,
            String gatewayRoles,
            Long ownerUserId,
            String entityType,
            Long entityId,
            String purpose,
            MediaVisibility visibility
    );

    MediaFileResponse getById(Long id, Long gatewayUserId, String gatewayRoles);

    Page<MediaFileResponse> search(String entityType, String purpose, String provider, Long ownerUserId, String keyword, String gatewayRoles, Pageable pageable);

    List<MediaFileResponse> getByEntity(String entityType, Long entityId, String purpose, String gatewayRoles);

    Resource getFile(String storageKey);

    void delete(Long id, boolean force, String gatewayRoles);

    void deleteByStorageKey(String storageKey, String gatewayRoles);
}

package com.triquang.service;

import com.triquang.model.MediaVisibility;
import com.triquang.payload.MediaFileResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MediaService {

    MediaFileResponse upload(
            MultipartFile file,
            Long ownerUserId,
            String entityType,
            Long entityId,
            String purpose,
            MediaVisibility visibility
    );

    MediaFileResponse getById(Long id);

    List<MediaFileResponse> getByEntity(String entityType, Long entityId, String purpose);

    Resource getFile(String storageKey);

    void delete(Long id);
}

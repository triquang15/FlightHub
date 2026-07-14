package com.triquang.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface AncillaryIconStorageService {

    StoredAncillaryIcon store(Long ancillaryId, MultipartFile file);

    AncillaryIconResource load(Long ancillaryId, String filename);

    void delete(String objectKey);

    record StoredAncillaryIcon(String objectKey, String publicUrl, String contentType) {}

    record AncillaryIconResource(Resource resource, String contentType) {}
}

package com.triquang.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface AvatarStorageService {

    StoredAvatar store(Long userId, MultipartFile file);

    AvatarResource load(Long userId, String filename);

    void delete(String objectKey);

    record StoredAvatar(String objectKey, String publicUrl, String contentType) {}

    record AvatarResource(Resource resource, String contentType) {}
}

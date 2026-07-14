package com.triquang.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface AirlineLogoStorageService {

    StoredAirlineLogo store(Long airlineId, MultipartFile file);

    AirlineLogoResource load(Long airlineId, String filename);

    void delete(String objectKey);

    record StoredAirlineLogo(String objectKey, String publicUrl, String contentType) {}

    record AirlineLogoResource(Resource resource, String contentType) {}
}

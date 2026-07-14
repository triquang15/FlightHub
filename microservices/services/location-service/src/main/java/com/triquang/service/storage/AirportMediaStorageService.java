package com.triquang.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface AirportMediaStorageService {

    StoredAirportMedia storeHeroImage(Long airportId, MultipartFile file);

    AirportMediaResource loadHeroImage(Long airportId, String filename);

    void delete(String objectKey);

    record StoredAirportMedia(String objectKey, String publicUrl, String contentType) {}

    record AirportMediaResource(Resource resource, String contentType) {}
}

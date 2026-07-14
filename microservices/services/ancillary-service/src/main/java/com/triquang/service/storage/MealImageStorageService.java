package com.triquang.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface MealImageStorageService {

    StoredMealImage store(Long mealId, MultipartFile file);

    MealImageResource load(Long mealId, String filename);

    void delete(String objectKey);

    record StoredMealImage(String objectKey, String publicUrl, String contentType) {}

    record MealImageResource(Resource resource, String contentType) {}
}

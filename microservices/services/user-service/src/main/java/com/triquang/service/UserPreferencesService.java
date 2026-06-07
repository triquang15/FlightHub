package com.triquang.service;

import com.triquang.payload.request.UpdateUserPreferencesRequest;
import com.triquang.payload.response.UserPreferencesResponse;

public interface UserPreferencesService {

    UserPreferencesResponse getPreferences(Long userId);

    UserPreferencesResponse updatePreferences(Long userId, UpdateUserPreferencesRequest request);
}

package com.triquang.service.impl;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.model.User;
import com.triquang.model.UserPreferences;
import com.triquang.payload.request.UpdateUserPreferencesRequest;
import com.triquang.payload.response.UserPreferencesResponse;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserPreferencesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPreferencesServiceImpl implements UserPreferencesService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;

    @Override
    public UserPreferencesResponse getPreferences(Long userId) {
        return toResponse(findOrCreate(userId));
    }

    @Override
    public UserPreferencesResponse updatePreferences(
            Long userId,
            UpdateUserPreferencesRequest request
    ) {
        UserPreferences preferences = findOrCreate(userId);

        if (request.getTheme() != null) {
            preferences.setTheme(request.getTheme());
        }

        if (request.getLanguage() != null) {
            preferences.setLanguage(request.getLanguage().trim().replace('_', '-'));
        }

        if (request.getTimezone() != null) {
            preferences.setTimezone(validateTimezone(request.getTimezone()));
        }

        return toResponse(preferencesRepository.saveAndFlush(preferences));
    }

    private UserPreferences findOrCreate(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

                    return preferencesRepository.saveAndFlush(UserPreferences.builder()
                            .user(user)
                            .build());
                });
    }

    private String validateTimezone(String timezone) {
        String normalized = timezone.trim();

        try {
            ZoneId.of(normalized);
            return normalized;
        } catch (DateTimeException exception) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private UserPreferencesResponse toResponse(UserPreferences preferences) {
        return UserPreferencesResponse.builder()
                .theme(preferences.getTheme())
                .language(preferences.getLanguage())
                .timezone(preferences.getTimezone())
                .updatedAt(preferences.getUpdatedAt())
                .build();
    }
}

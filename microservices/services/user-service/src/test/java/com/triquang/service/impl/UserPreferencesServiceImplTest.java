package com.triquang.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.triquang.enums.ThemePreference;
import com.triquang.exception.BaseException;
import com.triquang.model.User;
import com.triquang.model.UserPreferences;
import com.triquang.payload.request.UpdateUserPreferencesRequest;
import com.triquang.payload.response.UserPreferencesResponse;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserPreferencesServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPreferencesRepository preferencesRepository;

    private UserPreferencesServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserPreferencesServiceImpl(userRepository, preferencesRepository);
    }

    @Test
    void getPreferencesCreatesDefaultsWhenMissing() {
        User user = User.builder().id(7L).build();
        when(preferencesRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(preferencesRepository.saveAndFlush(any(UserPreferences.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesResponse response = service.getPreferences(7L);

        assertEquals(ThemePreference.SYSTEM, response.getTheme());
        assertEquals("en", response.getLanguage());
        assertEquals("UTC", response.getTimezone());
        verify(preferencesRepository).saveAndFlush(any(UserPreferences.class));
    }

    @Test
    void updatePreferencesAppliesPartialUpdate() {
        UserPreferences preferences = UserPreferences.builder()
                .user(User.builder().id(7L).build())
                .build();
        when(preferencesRepository.findByUserId(7L)).thenReturn(Optional.of(preferences));
        when(preferencesRepository.saveAndFlush(any(UserPreferences.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setTheme(ThemePreference.DARK);
        request.setLanguage("vi_VN");
        request.setTimezone("Asia/Ho_Chi_Minh");

        UserPreferencesResponse response = service.updatePreferences(7L, request);

        assertEquals(ThemePreference.DARK, response.getTheme());
        assertEquals("vi-VN", response.getLanguage());
        assertEquals("Asia/Ho_Chi_Minh", response.getTimezone());
    }

    @Test
    void updatePreferencesRejectsInvalidTimezone() {
        UserPreferences preferences = UserPreferences.builder()
                .user(User.builder().id(7L).build())
                .build();
        when(preferencesRepository.findByUserId(7L)).thenReturn(Optional.of(preferences));

        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setTimezone("Not/A_Timezone");

        assertThrows(BaseException.class, () -> service.updatePreferences(7L, request));
    }
}

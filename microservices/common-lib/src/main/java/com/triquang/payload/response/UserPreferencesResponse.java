package com.triquang.payload.response;

import java.time.LocalDateTime;

import com.triquang.enums.ThemePreference;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserPreferencesResponse {
    ThemePreference theme;
    String language;
    String timezone;
    LocalDateTime updatedAt;
}

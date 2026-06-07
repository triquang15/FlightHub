package com.triquang.payload.request;

import com.triquang.enums.ThemePreference;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserPreferencesRequest {

    private ThemePreference theme;

    @Pattern(
            regexp = "^[a-zA-Z]{2,3}([_-][a-zA-Z]{2,4})?$",
            message = "Language must be a valid locale code"
    )
    private String language;

    @Size(max = 64)
    private String timezone;
}

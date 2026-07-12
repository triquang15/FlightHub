package com.triquang.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AppleLoginRequest {

    @NotBlank
    private String idToken;

    private String fullName;
}

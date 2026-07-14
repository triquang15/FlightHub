package com.triquang.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FacebookLoginRequest {

    @NotBlank
    private String accessToken;
}

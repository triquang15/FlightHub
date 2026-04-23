package com.triquang.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.triquang.dto.UserDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String message;
    private String title;
    private UserDTO user;
}

package com.shawilTech.netproxi.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String username;
    private String email;
    private String address;
    private String phone;
    private String role;
    private List<String> roles;
    private UUID companyId;
    private UUID id;
    private String message;
}

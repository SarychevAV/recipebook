package com.recipebook.user.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {}
package com.recipebook.user.dto;

import com.recipebook.user.Role;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        Role role
) {}
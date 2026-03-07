package com.recipebook.user.dto;

import com.recipebook.user.Role;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Данные пользователя")
public record UserResponse(
        @Schema(description = "Уникальный идентификатор пользователя")
        UUID id,

        @Schema(description = "Отображаемое имя пользователя", example = "chef_ivan")
        String username,

        @Schema(description = "Электронная почта", example = "ivan@example.com")
        String email,

        @Schema(description = "Роль пользователя в системе", example = "USER")
        Role role
) {}

package com.recipebook.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Ответ при успешной аутентификации")
public record AuthResponse(
        @Schema(description = "JWT-токен для авторизации запросов")
        String token,

        @Schema(description = "Данные аутентифицированного пользователя")
        UserResponse user
) {}

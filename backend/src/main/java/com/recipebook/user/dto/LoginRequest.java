package com.recipebook.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Запрос на вход в систему")
public record LoginRequest(

        @Schema(description = "Электронная почта", example = "ivan@example.com")
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        @Schema(description = "Пароль", example = "securePass1")
        @NotBlank(message = "Password is required")
        String password
) {}

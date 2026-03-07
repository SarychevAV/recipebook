package com.recipebook.tag.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Запрос на создание тега")
public record CreateTagRequest(
        @Schema(description = "Название тега", example = "Итальянская кухня", maxLength = 50)
        @NotBlank(message = "Tag name must not be blank")
        @Size(max = 50, message = "Tag name must not exceed 50 characters")
        String name
) {
}

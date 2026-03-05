package com.recipebook.tag.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Тег для категоризации рецептов")
public record TagResponse(
        @Schema(description = "Уникальный идентификатор тега")
        UUID id,

        @Schema(description = "Название тега", example = "Итальянская кухня")
        String name
) {
}

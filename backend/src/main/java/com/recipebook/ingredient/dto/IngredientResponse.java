package com.recipebook.ingredient.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Ингредиент рецепта")
public record IngredientResponse(
        @Schema(description = "Уникальный идентификатор ингредиента")
        UUID id,

        @Schema(description = "Название ингредиента", example = "Спагетти")
        String name,

        @Schema(description = "Количество", example = "200")
        String amount,

        @Schema(description = "Единица измерения", example = "г")
        String unit,

        @Schema(description = "Порядковый номер в списке ингредиентов", example = "0")
        int orderIndex
) {
}

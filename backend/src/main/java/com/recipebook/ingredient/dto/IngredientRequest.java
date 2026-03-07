package com.recipebook.ingredient.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Ингредиент рецепта")
public record IngredientRequest(
        @Schema(description = "Название ингредиента", example = "Спагетти", maxLength = 100)
        @NotBlank(message = "Ingredient name must not be blank")
        @Size(max = 100, message = "Ingredient name must not exceed 100 characters")
        String name,

        @Schema(description = "Количество", example = "200", maxLength = 50)
        @Size(max = 50, message = "Amount must not exceed 50 characters")
        String amount,

        @Schema(description = "Единица измерения", example = "г", maxLength = 50)
        @Size(max = 50, message = "Unit must not exceed 50 characters")
        String unit,

        @Schema(description = "Порядковый номер ингредиента в списке", example = "0")
        int orderIndex
) {
}

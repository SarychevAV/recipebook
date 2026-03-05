package com.recipebook.recipe.dto;

import com.recipebook.ingredient.dto.IngredientRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Schema(description = "Запрос на обновление рецепта")
public record UpdateRecipeRequest(
        @Schema(description = "Новое название рецепта", example = "Паста Карбонара (обновлённая)", maxLength = 255)
        @NotBlank(message = "Title must not be blank")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @Schema(description = "Новое описание рецепта", maxLength = 2000)
        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @Schema(description = "Новая инструкция приготовления")
        @NotBlank(message = "Instructions must not be blank")
        String instructions,

        @Schema(description = "Новое время приготовления в минутах", example = "35", minimum = "1")
        @Min(value = 1, message = "Cooking time must be at least 1 minute")
        Integer cookingTimeMinutes,

        @Schema(description = "Новое количество порций", example = "4", minimum = "1")
        @Min(value = 1, message = "Servings must be at least 1")
        Integer servings,

        @Schema(description = "Обновлённый список ингредиентов (заменяет текущий)")
        @NotEmpty(message = "At least one ingredient is required")
        @Valid
        List<IngredientRequest> ingredients,

        @Schema(description = "Обновлённый набор тегов (заменяет текущий)")
        Set<UUID> tagIds
) {
}

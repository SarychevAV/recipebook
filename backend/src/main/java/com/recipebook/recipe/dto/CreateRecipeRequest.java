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

@Schema(description = "Запрос на создание рецепта")
public record CreateRecipeRequest(
        @Schema(description = "Название рецепта", example = "Паста Карбонара", maxLength = 255)
        @NotBlank(message = "Title must not be blank")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @Schema(description = "Краткое описание рецепта", example = "Классическая итальянская паста со сливочным соусом", maxLength = 2000)
        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @Schema(description = "Пошаговая инструкция приготовления", example = "1. Отварить пасту. 2. Смешать яйца с сыром...")
        @NotBlank(message = "Instructions must not be blank")
        String instructions,

        @Schema(description = "Время приготовления в минутах", example = "30", minimum = "1")
        @Min(value = 1, message = "Cooking time must be at least 1 minute")
        Integer cookingTimeMinutes,

        @Schema(description = "Количество порций", example = "2", minimum = "1")
        @Min(value = 1, message = "Servings must be at least 1")
        Integer servings,

        @Schema(description = "Список ингредиентов (минимум один)")
        @NotEmpty(message = "At least one ingredient is required")
        @Valid
        List<IngredientRequest> ingredients,

        @Schema(description = "Идентификаторы тегов для категоризации рецепта")
        Set<UUID> tagIds
) {
}

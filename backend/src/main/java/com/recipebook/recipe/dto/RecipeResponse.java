package com.recipebook.recipe.dto;

import com.recipebook.ingredient.dto.IngredientResponse;
import com.recipebook.tag.dto.TagResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Schema(description = "Полная информация о рецепте")
public record RecipeResponse(
        @Schema(description = "Уникальный идентификатор рецепта")
        UUID id,

        @Schema(description = "Название рецепта", example = "Паста Карбонара")
        String title,

        @Schema(description = "Описание рецепта", example = "Классическая итальянская паста")
        String description,

        @Schema(description = "Пошаговая инструкция приготовления")
        String instructions,

        @Schema(description = "Время приготовления в минутах", example = "30")
        Integer cookingTimeMinutes,

        @Schema(description = "Количество порций", example = "2")
        Integer servings,

        @Schema(description = "URL фотографии рецепта")
        String photoUrl,

        @Schema(description = "Имя автора рецепта", example = "chef_ivan")
        String ownerUsername,

        @Schema(description = "Идентификатор автора рецепта")
        UUID ownerId,

        @Schema(description = "Теги рецепта")
        List<TagResponse> tags,

        @Schema(description = "Ингредиенты рецепта")
        List<IngredientResponse> ingredients,

        @Schema(description = "Дата и время создания")
        Instant createdAt,

        @Schema(description = "Дата и время последнего обновления")
        Instant updatedAt
) {
}

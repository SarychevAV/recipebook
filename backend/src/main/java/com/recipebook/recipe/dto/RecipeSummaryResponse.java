package com.recipebook.recipe.dto;

import com.recipebook.tag.dto.TagResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Schema(description = "Краткая информация о рецепте (для списков и поиска)")
public record RecipeSummaryResponse(
        @Schema(description = "Уникальный идентификатор рецепта")
        UUID id,

        @Schema(description = "Название рецепта", example = "Паста Карбонара")
        String title,

        @Schema(description = "Краткое описание", example = "Классическая итальянская паста")
        String description,

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

        @Schema(description = "Дата и время создания")
        Instant createdAt
) {
}

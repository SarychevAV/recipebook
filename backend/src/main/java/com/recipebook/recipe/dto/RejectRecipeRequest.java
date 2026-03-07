package com.recipebook.recipe.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRecipeRequest(@NotBlank String reason) {}

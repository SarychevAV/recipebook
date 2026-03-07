package com.recipebook.recipe;

import com.recipebook.ingredient.IngredientEntity;
import com.recipebook.ingredient.dto.IngredientResponse;
import com.recipebook.recipe.dto.RecipeResponse;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.tag.TagMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {TagMapper.class})
public interface RecipeMapper {

    @Mapping(target = "ownerUsername", source = "owner.username")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "tags", source = "tags")
    @Mapping(target = "ingredients", source = "ingredients")
    RecipeResponse toResponse(RecipeEntity recipe);

    @Mapping(target = "ownerUsername", source = "owner.username")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "tags", source = "tags")
    RecipeSummaryResponse toSummaryResponse(RecipeEntity recipe);

    IngredientResponse toIngredientResponse(IngredientEntity ingredient);

    List<IngredientResponse> toIngredientResponseList(List<IngredientEntity> ingredients);
}

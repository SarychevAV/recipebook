package com.recipebook.recipe;

import com.recipebook.common.exception.InvalidOperationException;
import com.recipebook.common.exception.RecipeNotFoundException;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.user.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeMapper recipeMapper;

    @Transactional(readOnly = true)
    public Page<RecipeSummaryResponse> getPendingRecipes(Pageable pageable) {
        return recipeRepository.findAllPendingWithTags(pageable)
                .map(recipeMapper::toSummaryResponse);
    }

    @Transactional
    public RecipeSummaryResponse approveRecipe(UUID id, UserEntity admin) {
        RecipeEntity recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        if (recipe.getStatus() != RecipeStatus.PENDING_REVIEW) {
            throw new InvalidOperationException(
                    "Only PENDING_REVIEW recipes can be approved, current status: " + recipe.getStatus());
        }

        recipe.updateStatus(RecipeStatus.PUBLISHED, null);
        RecipeEntity saved = recipeRepository.save(recipe);
        log.info("Recipe approved: id={}, admin={}", id, admin.getId());
        return recipeMapper.toSummaryResponse(saved);
    }

    @Transactional
    public RecipeSummaryResponse rejectRecipe(UUID id, String reason, UserEntity admin) {
        RecipeEntity recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        if (recipe.getStatus() != RecipeStatus.PENDING_REVIEW) {
            throw new InvalidOperationException(
                    "Only PENDING_REVIEW recipes can be rejected, current status: " + recipe.getStatus());
        }

        recipe.updateStatus(RecipeStatus.REJECTED, reason);
        RecipeEntity saved = recipeRepository.save(recipe);
        log.info("Recipe rejected: id={}, admin={}, reason={}", id, admin.getId(), reason);
        return recipeMapper.toSummaryResponse(saved);
    }
}

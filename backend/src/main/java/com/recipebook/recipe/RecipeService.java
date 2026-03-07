package com.recipebook.recipe;

import com.recipebook.common.exception.InvalidOperationException;
import com.recipebook.common.exception.RecipeNotFoundException;
import com.recipebook.common.exception.UnauthorizedAccessException;
import com.recipebook.ingredient.IngredientEntity;
import com.recipebook.recipe.dto.CreateRecipeRequest;
import com.recipebook.recipe.dto.RecipeResponse;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.recipe.dto.UpdateRecipeRequest;
import com.recipebook.storage.StorageService;
import com.recipebook.tag.TagEntity;
import com.recipebook.tag.TagRepository;
import com.recipebook.user.Role;
import com.recipebook.user.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final TagRepository tagRepository;
    private final RecipeMapper recipeMapper;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public Page<RecipeSummaryResponse> search(String q, UUID tagId,
                                              Integer minTime, Integer maxTime,
                                              Pageable pageable) {
        Specification<RecipeEntity> spec = RecipeSpecification.isPublished();
        Specification<RecipeEntity> filters = buildFiltersSpec(q, tagId, minTime, maxTime);
        if (filters != null) {
            spec = spec.and(filters);
        }
        Page<RecipeEntity> page = recipeRepository.findAll(spec, pageable);
        return page.map(recipeMapper::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public RecipeResponse findById(UUID id, UserEntity currentUser) {
        RecipeEntity recipe = recipeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        if (recipe.getStatus() == RecipeStatus.PUBLISHED) {
            return recipeMapper.toResponse(recipe);
        }

        boolean isOwner = currentUser != null && recipe.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;

        if (isOwner || isAdmin) {
            return recipeMapper.toResponse(recipe);
        }

        throw new RecipeNotFoundException(id);
    }

    @Transactional(readOnly = true)
    public Page<RecipeSummaryResponse> getMyRecipes(UUID ownerId, Pageable pageable) {
        Page<RecipeEntity> page = recipeRepository.findByOwnerIdWithTags(ownerId, pageable);
        return page.map(recipeMapper::toSummaryResponse);
    }

    @Transactional
    public RecipeResponse create(CreateRecipeRequest request, UserEntity owner) {
        Set<TagEntity> tags = resolveTags(request.tagIds());

        RecipeEntity recipe = RecipeEntity.builder()
                .title(request.title())
                .description(request.description())
                .instructions(request.instructions())
                .cookingTimeMinutes(request.cookingTimeMinutes())
                .servings(request.servings())
                .owner(owner)
                .tags(tags)
                .build();

        List<IngredientEntity> ingredients = buildIngredients(request.ingredients(), recipe);
        recipe.replaceIngredients(ingredients);

        RecipeEntity saved = recipeRepository.save(recipe);
        log.info("Recipe created: id={}, title={}, owner={}", saved.getId(), saved.getTitle(), owner.getId());
        return recipeMapper.toResponse(saved);
    }

    @Transactional
    public RecipeResponse update(UUID id, UpdateRecipeRequest request, UserEntity currentUser) {
        RecipeEntity recipe = recipeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        assertOwner(recipe, currentUser);

        if (recipe.getStatus() == RecipeStatus.PENDING_REVIEW) {
            throw new InvalidOperationException("Cannot edit recipe while pending review");
        }

        recipe.update(request.title(), request.description(), request.instructions(),
                request.cookingTimeMinutes(), request.servings());
        recipe.replaceTags(resolveTags(request.tagIds()));

        List<IngredientEntity> ingredients = buildIngredients(request.ingredients(), recipe);
        recipe.replaceIngredients(ingredients);

        if (recipe.getStatus() == RecipeStatus.REJECTED) {
            recipe.updateStatus(RecipeStatus.DRAFT, null);
        }

        RecipeEntity saved = recipeRepository.save(recipe);
        log.info("Recipe updated: id={}, owner={}", id, currentUser.getId());
        return recipeMapper.toResponse(saved);
    }

    @Transactional
    public RecipeResponse submitForReview(UUID id, UserEntity currentUser) {
        RecipeEntity recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));

        assertOwner(recipe, currentUser);

        if (recipe.getStatus() != RecipeStatus.DRAFT && recipe.getStatus() != RecipeStatus.REJECTED) {
            throw new InvalidOperationException(
                    "Only DRAFT or REJECTED recipes can be submitted for review, current status: " + recipe.getStatus());
        }

        recipe.updateStatus(RecipeStatus.PENDING_REVIEW, null);
        RecipeEntity saved = recipeRepository.save(recipe);
        log.info("Recipe submitted for review: id={}, owner={}", id, currentUser.getId());
        return recipeMapper.toResponse(saved);
    }

    @Transactional
    public RecipeResponse uploadPhoto(UUID id, MultipartFile file, UserEntity currentUser) {
        RecipeEntity recipe = recipeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
        assertOwner(recipe, currentUser);

        try {
            String url = storageService.upload(
                    file.getOriginalFilename(),
                    file.getInputStream(),
                    file.getSize(),
                    file.getContentType()
            );
            recipe.updatePhotoUrl(url);
            RecipeEntity saved = recipeRepository.save(recipe);
            log.info("Photo uploaded for recipe: id={}", id);
            return recipeMapper.toResponse(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }
    }

    @Transactional
    public void delete(UUID id, UserEntity currentUser) {
        RecipeEntity recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
        assertOwner(recipe, currentUser);
        recipeRepository.delete(recipe);
        log.info("Recipe deleted: id={}, owner={}", id, currentUser.getId());
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private Specification<RecipeEntity> buildFiltersSpec(String q, UUID tagId,
                                                         Integer minTime, Integer maxTime) {
        Specification<RecipeEntity> spec = null;

        if (q != null && !q.isBlank()) {
            spec = RecipeSpecification.titleContains(q);
        }
        if (tagId != null) {
            Specification<RecipeEntity> tagSpec = RecipeSpecification.hasTag(tagId);
            spec = (spec == null) ? tagSpec : spec.and(tagSpec);
        }
        if (minTime != null) {
            Specification<RecipeEntity> minSpec = RecipeSpecification.minCookingTime(minTime);
            spec = (spec == null) ? minSpec : spec.and(minSpec);
        }
        if (maxTime != null) {
            Specification<RecipeEntity> maxSpec = RecipeSpecification.maxCookingTime(maxTime);
            spec = (spec == null) ? maxSpec : spec.and(maxSpec);
        }
        return spec;
    }

    private Set<TagEntity> resolveTags(Set<UUID> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Collections.emptySet();
        }
        return tagRepository.findAllByIdIn(tagIds);
    }

    private List<IngredientEntity> buildIngredients(
            List<com.recipebook.ingredient.dto.IngredientRequest> requests,
            RecipeEntity recipe) {
        return requests.stream()
                .map(req -> IngredientEntity.builder()
                        .recipe(recipe)
                        .name(req.name())
                        .amount(req.amount())
                        .unit(req.unit())
                        .orderIndex(req.orderIndex())
                        .build())
                .toList();
    }

    private void assertOwner(RecipeEntity recipe, UserEntity currentUser) {
        if (!recipe.getOwner().getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException("You are not the owner of this recipe");
        }
    }
}

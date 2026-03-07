package com.recipebook.recipe;

import com.recipebook.common.exception.RecipeNotFoundException;
import com.recipebook.common.exception.UnauthorizedAccessException;
import com.recipebook.ingredient.IngredientEntity;
import com.recipebook.ingredient.dto.IngredientRequest;
import com.recipebook.recipe.dto.CreateRecipeRequest;
import com.recipebook.recipe.dto.RecipeResponse;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.recipe.dto.UpdateRecipeRequest;
import com.recipebook.tag.TagEntity;
import com.recipebook.tag.TagRepository;
import com.recipebook.tag.dto.TagResponse;
import com.recipebook.user.Role;
import com.recipebook.user.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private RecipeMapper recipeMapper;

    @InjectMocks
    private RecipeService recipeService;

    private UserEntity owner;
    private UserEntity otherUser;
    private RecipeEntity sampleRecipe;

    @BeforeEach
    void setUp() {
        owner = UserEntity.builder()
                .username("chef")
                .email("chef@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(owner, "id", UUID.randomUUID());

        otherUser = UserEntity.builder()
                .username("stranger")
                .email("stranger@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(otherUser, "id", UUID.randomUUID());

        sampleRecipe = RecipeEntity.builder()
                .title("Pasta Carbonara")
                .description("Classic Italian pasta")
                .instructions("Cook pasta, mix eggs and cheese, combine")
                .cookingTimeMinutes(30)
                .servings(2)
                .owner(owner)
                .build();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_whenValidRequest_thenRecipeSaved() {
        CreateRecipeRequest request = new CreateRecipeRequest(
                "Pasta Carbonara",
                "Classic Italian pasta",
                "Cook pasta, mix eggs and cheese, combine",
                30, 2,
                List.of(new IngredientRequest("Pasta", "200", "g", 0)),
                Set.of()
        );
        RecipeResponse expected = buildRecipeResponse(sampleRecipe);

        when(recipeRepository.save(any(RecipeEntity.class))).thenReturn(sampleRecipe);
        when(recipeMapper.toResponse(sampleRecipe)).thenReturn(expected);

        RecipeResponse result = recipeService.create(request, owner);

        assertThat(result.title()).isEqualTo("Pasta Carbonara");
        verify(recipeRepository).save(any(RecipeEntity.class));
    }

    @Test
    void create_whenTagIdsProvided_thenTagsResolved() {
        UUID tagId = UUID.randomUUID();
        TagEntity tag = TagEntity.builder().name("Italian").build();
        CreateRecipeRequest request = new CreateRecipeRequest(
                "Pasta", null, "Cook it", 20, 1,
                List.of(new IngredientRequest("Pasta", "200", "g", 0)),
                Set.of(tagId)
        );
        RecipeResponse expected = buildRecipeResponse(sampleRecipe);

        when(tagRepository.findAllByIdIn(Set.of(tagId))).thenReturn(Set.of(tag));
        when(recipeRepository.save(any(RecipeEntity.class))).thenReturn(sampleRecipe);
        when(recipeMapper.toResponse(sampleRecipe)).thenReturn(expected);

        recipeService.create(request, owner);

        verify(tagRepository).findAllByIdIn(Set.of(tagId));
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_whenExists_thenReturnsResponse() {
        UUID id = UUID.randomUUID();
        RecipeResponse expected = buildRecipeResponse(sampleRecipe);

        when(recipeRepository.findByIdWithDetails(id)).thenReturn(Optional.of(sampleRecipe));
        when(recipeMapper.toResponse(sampleRecipe)).thenReturn(expected);

        RecipeResponse result = recipeService.findById(id);

        assertThat(result.title()).isEqualTo("Pasta Carbonara");
    }

    @Test
    void findById_whenNotFound_thenThrowsRecipeNotFoundException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findByIdWithDetails(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.findById(id))
                .isInstanceOf(RecipeNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_whenOwnerUpdates_thenRecipeSaved() {
        UUID id = UUID.randomUUID();
        UpdateRecipeRequest request = new UpdateRecipeRequest(
                "Updated Pasta", "Updated description", "New instructions",
                40, 3,
                List.of(new IngredientRequest("Pasta", "300", "g", 0)),
                Set.of()
        );

        RecipeResponse expected = buildRecipeResponse(sampleRecipe);

        when(recipeRepository.findByIdWithDetails(id)).thenReturn(Optional.of(sampleRecipe));
        when(recipeRepository.save(any(RecipeEntity.class))).thenReturn(sampleRecipe);
        when(recipeMapper.toResponse(sampleRecipe)).thenReturn(expected);

        RecipeResponse result = recipeService.update(id, request, owner);

        assertThat(result).isNotNull();
        verify(recipeRepository).save(sampleRecipe);
    }

    @Test
    void update_whenNotOwner_thenThrowsUnauthorizedAccessException() {
        UUID id = UUID.randomUUID();
        UpdateRecipeRequest request = new UpdateRecipeRequest(
                "Hacked", null, "Hacked instructions",
                10, 1,
                List.of(new IngredientRequest("Water", "1", "cup", 0)),
                Set.of()
        );

        when(recipeRepository.findByIdWithDetails(id)).thenReturn(Optional.of(sampleRecipe));

        assertThatThrownBy(() -> recipeService.update(id, request, otherUser))
                .isInstanceOf(UnauthorizedAccessException.class);

        verify(recipeRepository, never()).save(any());
    }

    @Test
    void update_whenRecipeNotFound_thenThrowsRecipeNotFoundException() {
        UUID id = UUID.randomUUID();
        UpdateRecipeRequest request = new UpdateRecipeRequest(
                "Title", null, "Instructions", null, null,
                List.of(new IngredientRequest("Egg", "2", "pcs", 0)),
                Set.of()
        );
        when(recipeRepository.findByIdWithDetails(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.update(id, request, owner))
                .isInstanceOf(RecipeNotFoundException.class);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_whenOwnerDeletes_thenRecipeRemoved() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.of(sampleRecipe));

        recipeService.delete(id, owner);

        verify(recipeRepository).delete(sampleRecipe);
    }

    @Test
    void delete_whenNotOwner_thenThrowsUnauthorizedAccessException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.of(sampleRecipe));

        assertThatThrownBy(() -> recipeService.delete(id, otherUser))
                .isInstanceOf(UnauthorizedAccessException.class);

        verify(recipeRepository, never()).delete(any(RecipeEntity.class));
    }

    @Test
    void delete_whenNotFound_thenThrowsRecipeNotFoundException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.delete(id, owner))
                .isInstanceOf(RecipeNotFoundException.class);
    }

    // ── search ────────────────────────────────────────────────────────────────

    @Test
    void search_whenNoFilters_thenDelegatesToFindAllWithTags() {
        PageRequest pageable = PageRequest.of(0, 20);
        RecipeSummaryResponse summary = buildSummaryResponse(sampleRecipe);
        Page<RecipeEntity> entityPage = new PageImpl<>(List.of(sampleRecipe));

        when(recipeRepository.findAllWithTags(pageable)).thenReturn(entityPage);
        when(recipeMapper.toSummaryResponse(sampleRecipe)).thenReturn(summary);

        Page<RecipeSummaryResponse> result = recipeService.search(null, null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(recipeRepository).findAllWithTags(pageable);
        verify(recipeRepository, never()).findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(pageable));
    }

    @Test
    void search_whenQueryProvided_thenDelegatesToSpecification() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<RecipeEntity> entityPage = new PageImpl<>(List.of(sampleRecipe));
        RecipeSummaryResponse summary = buildSummaryResponse(sampleRecipe);

        when(recipeRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(pageable)))
                .thenReturn(entityPage);
        when(recipeMapper.toSummaryResponse(sampleRecipe)).thenReturn(summary);

        Page<RecipeSummaryResponse> result = recipeService.search("pasta", null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(recipeRepository, never()).findAllWithTags(any());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private RecipeResponse buildRecipeResponse(RecipeEntity recipe) {
        return new RecipeResponse(
                UUID.randomUUID(), recipe.getTitle(), recipe.getDescription(),
                recipe.getInstructions(), recipe.getCookingTimeMinutes(), recipe.getServings(), "",
                owner.getUsername(), UUID.randomUUID(),
                List.of(), List.of(),
                Instant.now(), Instant.now()
        );
    }

    private RecipeSummaryResponse buildSummaryResponse(RecipeEntity recipe) {
        return new RecipeSummaryResponse(
                UUID.randomUUID(), recipe.getTitle(), recipe.getDescription(),
                recipe.getCookingTimeMinutes(), recipe.getServings(), "",
                owner.getUsername(), UUID.randomUUID(),
                List.of(), Instant.now()
        );
    }
}

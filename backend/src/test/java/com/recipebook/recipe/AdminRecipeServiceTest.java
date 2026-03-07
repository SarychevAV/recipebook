package com.recipebook.recipe;

import com.recipebook.common.exception.InvalidOperationException;
import com.recipebook.common.exception.RecipeNotFoundException;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminRecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeMapper recipeMapper;

    @InjectMocks
    private AdminRecipeService adminRecipeService;

    private UserEntity admin;
    private UserEntity owner;
    private RecipeEntity pendingRecipe;

    @BeforeEach
    void setUp() {
        admin = UserEntity.builder()
                .username("admin")
                .email("admin@example.com")
                .password("encoded")
                .role(Role.ADMIN)
                .build();
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());

        owner = UserEntity.builder()
                .username("chef")
                .email("chef@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(owner, "id", UUID.randomUUID());

        pendingRecipe = RecipeEntity.builder()
                .title("Pending Recipe")
                .description("Awaiting review")
                .instructions("Cook it")
                .cookingTimeMinutes(20)
                .servings(2)
                .owner(owner)
                .build();
        pendingRecipe.updateStatus(RecipeStatus.PENDING_REVIEW, null);
    }

    // ── approveRecipe ─────────────────────────────────────────────────────────

    @Test
    void approveRecipe_whenPendingReview_thenStatusBecomesPublished() {
        UUID id = UUID.randomUUID();
        RecipeSummaryResponse summary = buildSummaryResponse(pendingRecipe);

        when(recipeRepository.findById(id)).thenReturn(Optional.of(pendingRecipe));
        when(recipeRepository.save(pendingRecipe)).thenReturn(pendingRecipe);
        when(recipeMapper.toSummaryResponse(pendingRecipe)).thenReturn(summary);

        adminRecipeService.approveRecipe(id, admin);

        assertThat(pendingRecipe.getStatus()).isEqualTo(RecipeStatus.PUBLISHED);
        assertThat(pendingRecipe.getRejectionReason()).isNull();
        verify(recipeRepository).save(pendingRecipe);
    }

    @Test
    void approveRecipe_whenNotPendingReview_thenThrowsInvalidOperationException() {
        UUID id = UUID.randomUUID();
        pendingRecipe.updateStatus(RecipeStatus.DRAFT, null);
        when(recipeRepository.findById(id)).thenReturn(Optional.of(pendingRecipe));

        assertThatThrownBy(() -> adminRecipeService.approveRecipe(id, admin))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("PENDING_REVIEW");

        verify(recipeRepository, never()).save(any());
    }

    @Test
    void approveRecipe_whenNotFound_thenThrowsRecipeNotFoundException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminRecipeService.approveRecipe(id, admin))
                .isInstanceOf(RecipeNotFoundException.class);
    }

    // ── rejectRecipe ──────────────────────────────────────────────────────────

    @Test
    void rejectRecipe_whenPendingReview_thenStatusBecomesRejectedWithReason() {
        UUID id = UUID.randomUUID();
        String reason = "Insufficient instructions";
        RecipeSummaryResponse summary = buildSummaryResponse(pendingRecipe);

        when(recipeRepository.findById(id)).thenReturn(Optional.of(pendingRecipe));
        when(recipeRepository.save(pendingRecipe)).thenReturn(pendingRecipe);
        when(recipeMapper.toSummaryResponse(pendingRecipe)).thenReturn(summary);

        adminRecipeService.rejectRecipe(id, reason, admin);

        assertThat(pendingRecipe.getStatus()).isEqualTo(RecipeStatus.REJECTED);
        assertThat(pendingRecipe.getRejectionReason()).isEqualTo(reason);
        verify(recipeRepository).save(pendingRecipe);
    }

    @Test
    void rejectRecipe_whenAlreadyPublished_thenThrowsInvalidOperationException() {
        UUID id = UUID.randomUUID();
        pendingRecipe.updateStatus(RecipeStatus.PUBLISHED, null);
        when(recipeRepository.findById(id)).thenReturn(Optional.of(pendingRecipe));

        assertThatThrownBy(() -> adminRecipeService.rejectRecipe(id, "Bad", admin))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("PENDING_REVIEW");

        verify(recipeRepository, never()).save(any());
    }

    @Test
    void rejectRecipe_whenNotFound_thenThrowsRecipeNotFoundException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminRecipeService.rejectRecipe(id, "Bad", admin))
                .isInstanceOf(RecipeNotFoundException.class);
    }

    // ── getPendingRecipes ─────────────────────────────────────────────────────

    @Test
    void getPendingRecipes_thenDelegatesToRepositoryAndMapsResults() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<RecipeEntity> entityPage = new PageImpl<>(List.of(pendingRecipe));
        RecipeSummaryResponse summary = buildSummaryResponse(pendingRecipe);

        when(recipeRepository.findAllPendingWithTags(pageable)).thenReturn(entityPage);
        when(recipeMapper.toSummaryResponse(pendingRecipe)).thenReturn(summary);

        Page<RecipeSummaryResponse> result = adminRecipeService.getPendingRecipes(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Pending Recipe");
        verify(recipeRepository).findAllPendingWithTags(pageable);
    }

    @Test
    void getPendingRecipes_whenQueueEmpty_thenReturnsEmptyPage() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(recipeRepository.findAllPendingWithTags(pageable)).thenReturn(Page.empty());

        Page<RecipeSummaryResponse> result = adminRecipeService.getPendingRecipes(pageable);

        assertThat(result.getContent()).isEmpty();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private RecipeSummaryResponse buildSummaryResponse(RecipeEntity recipe) {
        return new RecipeSummaryResponse(
                UUID.randomUUID(), recipe.getTitle(), recipe.getDescription(),
                recipe.getCookingTimeMinutes(), recipe.getServings(), "",
                owner.getUsername(), UUID.randomUUID(),
                List.of(), Instant.now(),
                recipe.getStatus(), recipe.getRejectionReason()
        );
    }
}

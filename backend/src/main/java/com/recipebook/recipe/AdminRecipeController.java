package com.recipebook.recipe;

import com.recipebook.common.response.ApiResponse;
import com.recipebook.recipe.dto.RejectRecipeRequest;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.user.UserEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/recipes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Модерация", description = "Управление рецептами, ожидающими проверки (только для ADMIN)")
public class AdminRecipeController {

    private final AdminRecipeService adminRecipeService;

    @GetMapping
    @Operation(summary = "Рецепты на проверке",
               description = "Возвращает постраничный список рецептов со статусом PENDING_REVIEW")
    public ResponseEntity<ApiResponse<Page<RecipeSummaryResponse>>> getPendingRecipes(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC)
            Pageable pageable) {

        Page<RecipeSummaryResponse> page = adminRecipeService.getPendingRecipes(pageable);
        return ResponseEntity.ok(ApiResponse.of(page));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Одобрить рецепт",
               description = "Переводит рецепт из PENDING_REVIEW в PUBLISHED")
    public ResponseEntity<ApiResponse<RecipeSummaryResponse>> approveRecipe(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {

        RecipeSummaryResponse response = adminRecipeService.approveRecipe(id, currentUser);
        return ResponseEntity.ok(ApiResponse.of(response, "Рецепт одобрен"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Отклонить рецепт",
               description = "Переводит рецепт из PENDING_REVIEW в REJECTED с указанием причины")
    public ResponseEntity<ApiResponse<RecipeSummaryResponse>> rejectRecipe(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id,
            @Valid @RequestBody RejectRecipeRequest request,
            @AuthenticationPrincipal UserEntity currentUser) {

        RecipeSummaryResponse response = adminRecipeService.rejectRecipe(id, request.reason(), currentUser);
        return ResponseEntity.ok(ApiResponse.of(response, "Рецепт отклонён"));
    }
}

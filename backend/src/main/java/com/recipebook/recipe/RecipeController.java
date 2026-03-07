package com.recipebook.recipe;

import com.recipebook.common.response.ApiResponse;
import com.recipebook.recipe.dto.CreateRecipeRequest;
import com.recipebook.recipe.dto.RecipeResponse;
import com.recipebook.recipe.dto.RecipeSummaryResponse;
import com.recipebook.recipe.dto.UpdateRecipeRequest;
import com.recipebook.user.UserEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
@Tag(name = "Рецепты", description = "Создание, просмотр, обновление и удаление рецептов")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    @Operation(summary = "Поиск и фильтрация рецептов",
               description = "Возвращает постраничный список рецептов. Доступен без авторизации. " +
                             "Поддерживает фильтрацию по названию, тегу и времени приготовления.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Список рецептов успешно получен")
    })
    public ResponseEntity<ApiResponse<Page<RecipeSummaryResponse>>> search(
            @Parameter(description = "Поиск по названию рецепта")
            @RequestParam(required = false) String q,
            @Parameter(description = "Фильтр по ID тега")
            @RequestParam(required = false) UUID tagId,
            @Parameter(description = "Минимальное время приготовления (в минутах)")
            @RequestParam(required = false) Integer minTime,
            @Parameter(description = "Максимальное время приготовления (в минутах)")
            @RequestParam(required = false) Integer maxTime,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<RecipeSummaryResponse> page = recipeService.search(q, tagId, minTime, maxTime, pageable);
        return ResponseEntity.ok(ApiResponse.of(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить рецепт по ID",
               description = "Возвращает полную информацию о рецепте, включая ингредиенты и теги. Доступен без авторизации.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Рецепт найден"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Рецепт не найден",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<ApiResponse<RecipeResponse>> getById(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.of(recipeService.findById(id)));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Создать новый рецепт",
               description = "Создаёт рецепт от имени аутентифицированного пользователя")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Рецепт успешно создан"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Некорректные данные запроса",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Требуется авторизация",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<ApiResponse<RecipeResponse>> create(
            @Valid @RequestBody CreateRecipeRequest request,
            @AuthenticationPrincipal UserEntity currentUser) {

        RecipeResponse response = recipeService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response, "Рецепт создан"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Обновить рецепт",
               description = "Обновляет рецепт. Разрешено только владельцу рецепта.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Рецепт успешно обновлён"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Некорректные данные запроса",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Требуется авторизация",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Нет прав на редактирование этого рецепта",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Рецепт не найден",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<ApiResponse<RecipeResponse>> update(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRecipeRequest request,
            @AuthenticationPrincipal UserEntity currentUser) {

        RecipeResponse response = recipeService.update(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.of(response, "Рецепт обновлён"));
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Загрузить фото рецепта",
               description = "Загружает фото для рецепта. Разрешено только владельцу рецепта.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Фото успешно загружено"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Требуется авторизация",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Нет прав на редактирование этого рецепта",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Рецепт не найден",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<ApiResponse<RecipeResponse>> uploadPhoto(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id,
            @Parameter(description = "Файл фотографии", required = true)
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserEntity currentUser) {

        RecipeResponse response = recipeService.uploadPhoto(id, file, currentUser);
        return ResponseEntity.ok(ApiResponse.of(response, "Фото загружено"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Удалить рецепт",
               description = "Удаляет рецепт. Разрешено только владельцу рецепта.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Рецепт успешно удалён"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Требуется авторизация",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Нет прав на удаление этого рецепта",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Рецепт не найден",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "Идентификатор рецепта", required = true)
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {

        recipeService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}

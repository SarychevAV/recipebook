package com.recipebook.tag;

import com.recipebook.common.response.ApiResponse;
import com.recipebook.tag.dto.CreateTagRequest;
import com.recipebook.tag.dto.TagResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
@Tag(name = "Теги", description = "Управление тегами для категоризации рецептов")
public class TagController {

    private final TagService tagService;

    @GetMapping
    @Operation(summary = "Получить все теги",
               description = "Возвращает полный список тегов. Доступен без авторизации.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Список тегов успешно получен")
    })
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.of(tagService.findAll()));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Создать новый тег",
               description = "Создаёт тег для категоризации рецептов. Требует авторизации.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Тег успешно создан"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Некорректные данные запроса",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Требуется авторизация",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Тег с таким названием уже существует",
                    content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail")))
    })
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody CreateTagRequest request) {
        TagResponse response = tagService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response, "Тег создан"));
    }
}

package com.recipebook.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recipebook.ingredient.dto.IngredientRequest;
import com.recipebook.recipe.dto.CreateRecipeRequest;
import com.recipebook.recipe.dto.UpdateRecipeRequest;
import com.recipebook.tag.dto.CreateTagRequest;
import com.recipebook.user.dto.LoginRequest;
import com.recipebook.user.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class RecipeControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("recipebook_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String ownerToken;
    private String otherToken;

    @BeforeEach
    void setUp() throws Exception {
        ownerToken = registerAndGetToken("owner_" + UUID.randomUUID().toString().substring(0, 8),
                "owner_" + UUID.randomUUID() + "@test.com");
        otherToken = registerAndGetToken("other_" + UUID.randomUUID().toString().substring(0, 8),
                "other_" + UUID.randomUUID() + "@test.com");
    }

    // ── GET /api/v1/recipes ───────────────────────────────────────────────────

    @Test
    void getRecipes_whenNoFilters_thenReturnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/recipes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getRecipes_whenPublicAccess_thenNoAuthRequired() throws Exception {
        mockMvc.perform(get("/api/v1/recipes"))
                .andExpect(status().isOk());
    }

    // ── POST /api/v1/recipes ──────────────────────────────────────────────────

    @Test
    void createRecipe_whenAuthenticated_thenReturnsCreated() throws Exception {
        CreateRecipeRequest request = buildCreateRequest("Spaghetti Bolognese");

        mockMvc.perform(post("/api/v1/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Spaghetti Bolognese"))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.ingredients").isArray())
                .andExpect(jsonPath("$.data.ingredients[0].name").value("Ground beef"));
    }

    @Test
    void createRecipe_whenNotAuthenticated_thenReturnsUnauthorized() throws Exception {
        CreateRecipeRequest request = buildCreateRequest("Anonymous Recipe");

        mockMvc.perform(post("/api/v1/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createRecipe_whenInvalidRequest_thenReturnsBadRequest() throws Exception {
        CreateRecipeRequest invalid = new CreateRecipeRequest(
                "",   // blank title — invalid
                null, "Instructions", null, null,
                List.of(new IngredientRequest("Egg", "2", "pcs", 0)),
                Set.of()
        );

        mockMvc.perform(post("/api/v1/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // ── GET /api/v1/recipes/{id} ──────────────────────────────────────────────

    @Test
    void getRecipeById_whenExists_thenReturnsRecipe() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Tiramisu");

        mockMvc.perform(get("/api/v1/recipes/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Tiramisu"))
                .andExpect(jsonPath("$.data.instructions").isNotEmpty());
    }

    @Test
    void getRecipeById_whenNotFound_thenReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/recipes/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    // ── PUT /api/v1/recipes/{id} ──────────────────────────────────────────────

    @Test
    void updateRecipe_whenOwner_thenReturnsUpdated() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Pizza Margherita");
        UpdateRecipeRequest update = new UpdateRecipeRequest(
                "Pizza Margherita Updated", "Better recipe", "Updated steps",
                25, 4,
                List.of(new IngredientRequest("Flour", "500", "g", 0)),
                Set.of()
        );

        mockMvc.perform(put("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Pizza Margherita Updated"));
    }

    @Test
    void updateRecipe_whenNotOwner_thenReturnsForbidden() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Owner Only Recipe");
        UpdateRecipeRequest update = new UpdateRecipeRequest(
                "Hacked", null, "Hacked", null, null,
                List.of(new IngredientRequest("Water", "1", "cup", 0)),
                Set.of()
        );

        mockMvc.perform(put("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    // ── DELETE /api/v1/recipes/{id} ───────────────────────────────────────────

    @Test
    void deleteRecipe_whenOwner_thenReturnsNoContent() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Recipe to Delete");

        mockMvc.perform(delete("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/recipes/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRecipe_whenNotOwner_thenReturnsForbidden() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Protected Recipe");

        mockMvc.perform(delete("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    // ── search / filter ───────────────────────────────────────────────────────

    @Test
    void searchRecipes_whenQueryMatches_thenReturnsResults() throws Exception {
        createRecipeAndGetId(ownerToken, "Unique Lemon Tart 1234");

        mockMvc.perform(get("/api/v1/recipes").param("q", "Lemon Tart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Unique Lemon Tart 1234"));
    }

    @Test
    void searchRecipes_whenQueryNoMatch_thenReturnsEmptyPage() throws Exception {
        mockMvc.perform(get("/api/v1/recipes").param("q", "xyzzy_no_match_ever"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    @Test
    void searchRecipes_whenFilterByTag_thenReturnsMatchingRecipes() throws Exception {
        // Create a tag
        String tagId = createTagAndGetId("Dessert_" + UUID.randomUUID().toString().substring(0, 6));

        // Create recipe with that tag
        CreateRecipeRequest withTag = new CreateRecipeRequest(
                "Chocolate Cake", null, "Mix and bake", 60, 8,
                List.of(new IngredientRequest("Chocolate", "200", "g", 0)),
                Set.of(UUID.fromString(tagId))
        );
        mockMvc.perform(post("/api/v1/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withTag)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/recipes").param("tagId", tagId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Chocolate Cake"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String registerAndGetToken(String username, String email) throws Exception {
        RegisterRequest request = new RegisterRequest(username, email, "password123");
        String body = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).at("/data/token").asText();
    }

    private String createRecipeAndGetId(String token, String title) throws Exception {
        String body = mockMvc.perform(post("/api/v1/recipes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildCreateRequest(title))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).at("/data/id").asText();
    }

    private String createTagAndGetId(String name) throws Exception {
        CreateTagRequest request = new CreateTagRequest(name);
        String body = mockMvc.perform(post("/api/v1/tags")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).at("/data/id").asText();
    }

    private CreateRecipeRequest buildCreateRequest(String title) {
        return new CreateRecipeRequest(
                title,
                "A delicious " + title,
                "Step 1: Prepare. Step 2: Cook. Step 3: Serve.",
                30, 2,
                List.of(new IngredientRequest("Ground beef", "500", "g", 0),
                        new IngredientRequest("Tomato sauce", "200", "ml", 1)),
                Set.of()
        );
    }
}

package com.recipebook.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recipebook.ingredient.dto.IngredientRequest;
import com.recipebook.recipe.dto.CreateRecipeRequest;
import com.recipebook.recipe.dto.RejectRecipeRequest;
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
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        ownerToken = registerAndGetToken("owner_" + UUID.randomUUID().toString().substring(0, 8),
                "owner_" + UUID.randomUUID() + "@test.com");
        otherToken = registerAndGetToken("other_" + UUID.randomUUID().toString().substring(0, 8),
                "other_" + UUID.randomUUID() + "@test.com");
        // Admin is seeded by V6 migration
        adminToken = loginAndGetToken("admin@recipebook.com", "admin123");
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

    @Test
    void getRecipes_whenDraftRecipeExists_thenNotReturnedPublicly() throws Exception {
        // Create a DRAFT recipe (not published)
        createRecipeAndGetId(ownerToken, "Draft Only Recipe " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/recipes").param("q", "Draft Only Recipe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
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
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
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
    void getRecipeById_whenDraftAndOwner_thenReturnsRecipe() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "My Draft Recipe");

        // Owner can see their DRAFT recipe
        mockMvc.perform(get("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("My Draft Recipe"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }

    @Test
    void getRecipeById_whenDraftAndPublicAccess_thenReturns404() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Hidden Draft");

        // Anonymous cannot see DRAFT recipes
        mockMvc.perform(get("/api/v1/recipes/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void getRecipeById_whenPublished_thenPublicCanAccess() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Public Recipe");
        publishRecipe(id);

        mockMvc.perform(get("/api/v1/recipes/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Public Recipe"))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }

    @Test
    void getRecipeById_whenNotFound_thenReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/recipes/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    // ── GET /api/v1/recipes/my ────────────────────────────────────────────────

    @Test
    void getMyRecipes_whenAuthenticated_thenReturnsAllStatuses() throws Exception {
        String draftId = createRecipeAndGetId(ownerToken, "My Draft");
        String pendingId = createRecipeAndGetId(ownerToken, "My Pending");
        submitForReview(pendingId);

        mockMvc.perform(get("/api/v1/recipes/my")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getMyRecipes_whenNotAuthenticated_thenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/recipes/my"))
                .andExpect(status().isUnauthorized());
    }

    // ── POST /api/v1/recipes/{id}/submit ─────────────────────────────────────

    @Test
    void submitForReview_whenOwnerAndDraft_thenReturnsPendingReview() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Draft to Submit");

        mockMvc.perform(post("/api/v1/recipes/" + id + "/submit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING_REVIEW"));
    }

    @Test
    void submitForReview_whenNotAuthenticated_thenReturnsUnauthorized() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Recipe to Submit");

        mockMvc.perform(post("/api/v1/recipes/" + id + "/submit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void submitForReview_whenAlreadyPendingReview_thenReturnsBadRequest() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Already Pending");
        submitForReview(id);

        mockMvc.perform(post("/api/v1/recipes/" + id + "/submit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());
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
    void updateRecipe_whenPendingReview_thenReturnsBadRequest() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Recipe Under Review");
        submitForReview(id);

        UpdateRecipeRequest update = new UpdateRecipeRequest(
                "Updated While Pending", null, "New instructions", 20, 2,
                List.of(new IngredientRequest("Egg", "1", "pcs", 0)),
                Set.of()
        );

        mockMvc.perform(put("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest());
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

        // Verify recipe is gone — owner can no longer access it
        mockMvc.perform(get("/api/v1/recipes/" + id)
                        .header("Authorization", "Bearer " + ownerToken))
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
    void searchRecipes_whenQueryMatches_thenReturnsPublishedResults() throws Exception {
        String uniqueTitle = "Unique Lemon Tart " + UUID.randomUUID().toString().substring(0, 8);
        String id = createRecipeAndGetId(ownerToken, uniqueTitle);
        publishRecipe(id);

        mockMvc.perform(get("/api/v1/recipes").param("q", uniqueTitle))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value(uniqueTitle));
    }

    @Test
    void searchRecipes_whenQueryNoMatch_thenReturnsEmptyPage() throws Exception {
        mockMvc.perform(get("/api/v1/recipes").param("q", "xyzzy_no_match_ever"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    @Test
    void searchRecipes_whenFilterByTag_thenReturnsMatchingPublishedRecipes() throws Exception {
        String tagId = createTagAndGetId("Dessert_" + UUID.randomUUID().toString().substring(0, 6));

        CreateRecipeRequest withTag = new CreateRecipeRequest(
                "Chocolate Cake " + UUID.randomUUID().toString().substring(0, 6), null, "Mix and bake", 60, 8,
                List.of(new IngredientRequest("Chocolate", "200", "g", 0)),
                Set.of(UUID.fromString(tagId))
        );
        String body = mockMvc.perform(post("/api/v1/recipes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withTag)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String recipeId = objectMapper.readTree(body).at("/data/id").asText();
        publishRecipe(recipeId);

        mockMvc.perform(get("/api/v1/recipes").param("tagId", tagId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    // ── Admin moderation ──────────────────────────────────────────────────────

    @Test
    void approveRecipe_whenAdmin_thenReturnsPublished() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Waiting Approval");
        submitForReview(id);

        mockMvc.perform(post("/api/v1/admin/recipes/" + id + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }

    @Test
    void rejectRecipe_whenAdmin_thenReturnsRejectedWithReason() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "To Be Rejected");
        submitForReview(id);

        RejectRecipeRequest rejectRequest = new RejectRecipeRequest("Instructions too vague");
        mockMvc.perform(post("/api/v1/admin/recipes/" + id + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Instructions too vague"));
    }

    @Test
    void approveRecipe_whenRegularUser_thenReturnsForbidden() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Approval Attempt");
        submitForReview(id);

        mockMvc.perform(post("/api/v1/admin/recipes/" + id + "/approve")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPendingRecipes_whenAdmin_thenReturnsPendingList() throws Exception {
        String id = createRecipeAndGetId(ownerToken, "Pending For Admin");
        submitForReview(id);

        mockMvc.perform(get("/api/v1/admin/recipes")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getPendingRecipes_whenRegularUser_thenReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/recipes")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
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

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest request = new LoginRequest(email, password);
        String body = mockMvc.perform(post("/api/v1/auth/login")
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

    private void submitForReview(String id) throws Exception {
        mockMvc.perform(post("/api/v1/recipes/" + id + "/submit")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
    }

    private void publishRecipe(String id) throws Exception {
        submitForReview(id);
        mockMvc.perform(post("/api/v1/admin/recipes/" + id + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
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

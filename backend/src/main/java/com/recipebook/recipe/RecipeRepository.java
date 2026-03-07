package com.recipebook.recipe;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<RecipeEntity, UUID>,
        JpaSpecificationExecutor<RecipeEntity> {

    /**
     * Fetches a recipe with its tags and ingredients in a single query to avoid N+1.
     * Used for the detail view. Returns regardless of status.
     */
    @Query("""
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            LEFT JOIN FETCH r.ingredients
            WHERE r.id = :id
            """)
    Optional<RecipeEntity> findByIdWithDetails(@Param("id") UUID id);

    /**
     * Fetches only PUBLISHED recipes with tags (for public list/feed).
     */
    @Query(value = """
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            WHERE r.status = com.recipebook.recipe.RecipeStatus.PUBLISHED
            """,
           countQuery = "SELECT COUNT(r) FROM RecipeEntity r WHERE r.status = com.recipebook.recipe.RecipeStatus.PUBLISHED")
    Page<RecipeEntity> findAllPublishedWithTags(Pageable pageable);

    /**
     * Fetches all recipes for a given owner regardless of status (for /my endpoint).
     */
    @Query(value = """
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            WHERE r.owner.id = :ownerId
            """,
           countQuery = "SELECT COUNT(r) FROM RecipeEntity r WHERE r.owner.id = :ownerId")
    Page<RecipeEntity> findByOwnerIdWithTags(@Param("ownerId") UUID ownerId, Pageable pageable);

    /**
     * Fetches all PENDING_REVIEW recipes with tags (for admin moderation).
     */
    @Query(value = """
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            WHERE r.status = com.recipebook.recipe.RecipeStatus.PENDING_REVIEW
            """,
           countQuery = "SELECT COUNT(r) FROM RecipeEntity r WHERE r.status = com.recipebook.recipe.RecipeStatus.PENDING_REVIEW")
    Page<RecipeEntity> findAllPendingWithTags(Pageable pageable);
}

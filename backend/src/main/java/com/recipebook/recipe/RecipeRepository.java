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
     * Used for the detail view.
     */
    @Query("""
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            LEFT JOIN FETCH r.ingredients
            WHERE r.id = :id
            """)
    Optional<RecipeEntity> findByIdWithDetails(@Param("id") UUID id);

    /**
     * Fetches recipes with tags only (for list/summary view, no ingredients).
     */
    @Query(value = """
            SELECT DISTINCT r FROM RecipeEntity r
            LEFT JOIN FETCH r.tags
            """,
           countQuery = "SELECT COUNT(r) FROM RecipeEntity r")
    Page<RecipeEntity> findAllWithTags(Pageable pageable);
}

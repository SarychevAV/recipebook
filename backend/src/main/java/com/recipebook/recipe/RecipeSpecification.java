package com.recipebook.recipe;

import com.recipebook.tag.TagEntity;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class RecipeSpecification {

    private RecipeSpecification() {
    }

    public static Specification<RecipeEntity> titleContains(String query) {
        return (root, cq, cb) ->
                cb.like(cb.lower(root.get("title")), "%" + query.toLowerCase() + "%");
    }

    public static Specification<RecipeEntity> hasTag(UUID tagId) {
        return (root, cq, cb) -> {
            cq.distinct(true);
            Join<RecipeEntity, TagEntity> tags = root.join("tags", JoinType.INNER);
            return cb.equal(tags.get("id"), tagId);
        };
    }

    public static Specification<RecipeEntity> minCookingTime(Integer minTime) {
        return (root, cq, cb) ->
                cb.greaterThanOrEqualTo(root.get("cookingTimeMinutes"), minTime);
    }

    public static Specification<RecipeEntity> maxCookingTime(Integer maxTime) {
        return (root, cq, cb) ->
                cb.lessThanOrEqualTo(root.get("cookingTimeMinutes"), maxTime);
    }
}

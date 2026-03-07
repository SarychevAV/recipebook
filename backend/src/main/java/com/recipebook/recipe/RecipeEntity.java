package com.recipebook.recipe;

import com.recipebook.common.entity.BaseEntity;
import com.recipebook.ingredient.IngredientEntity;
import com.recipebook.tag.TagEntity;
import com.recipebook.user.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "recipes")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RecipeEntity extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String instructions;

    private Integer cookingTimeMinutes;

    private Integer servings;

    @Column(length = 1000)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RecipeStatus status = RecipeStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "recipe_tags",
            joinColumns = @JoinColumn(name = "recipe_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<TagEntity> tags = new HashSet<>();

    @OneToMany(mappedBy = "recipe", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<IngredientEntity> ingredients = new ArrayList<>();

    public void update(String title, String description, String instructions,
                       Integer cookingTimeMinutes, Integer servings) {
        this.title = title;
        this.description = description;
        this.instructions = instructions;
        this.cookingTimeMinutes = cookingTimeMinutes;
        this.servings = servings;
    }

    public void updatePhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public void replaceTags(Set<TagEntity> newTags) {
        this.tags.clear();
        this.tags.addAll(newTags);
    }

    public void replaceIngredients(List<IngredientEntity> newIngredients) {
        this.ingredients.clear();
        this.ingredients.addAll(newIngredients);
    }

    public void updateStatus(RecipeStatus status, String rejectionReason) {
        this.status = status;
        this.rejectionReason = rejectionReason;
    }
}

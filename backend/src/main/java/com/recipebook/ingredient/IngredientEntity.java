package com.recipebook.ingredient;

import com.recipebook.common.entity.BaseEntity;
import com.recipebook.recipe.RecipeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ingredients")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class IngredientEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private RecipeEntity recipe;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String amount;

    @Column(length = 50)
    private String unit;

    @Column(nullable = false)
    private int orderIndex;
}

package com.recipebook.common.exception;

import java.util.UUID;

public class RecipeNotFoundException extends ResourceNotFoundException {
    public RecipeNotFoundException(UUID id) {
        super("Recipe with id=" + id + " does not exist");
    }
}

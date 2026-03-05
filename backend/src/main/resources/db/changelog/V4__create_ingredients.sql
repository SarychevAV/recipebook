-- V4: Create ingredients table

CREATE TABLE ingredients
(
    id          UUID                     NOT NULL PRIMARY KEY,
    recipe_id   UUID                     NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    name        VARCHAR(100)             NOT NULL,
    amount      VARCHAR(50),
    unit        VARCHAR(50),
    order_index INTEGER                  NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ingredients_recipe_id ON ingredients (recipe_id);

--rollback DROP TABLE ingredients;

-- V3: Create recipes table and recipe_tags junction

CREATE TABLE recipes
(
    id                   UUID                     NOT NULL PRIMARY KEY,
    title                VARCHAR(255)             NOT NULL,
    description          TEXT,
    instructions         TEXT                     NOT NULL,
    cooking_time_minutes INTEGER,
    servings             INTEGER,
    owner_id             UUID                     NOT NULL REFERENCES users (id),
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_recipes_owner_id ON recipes (owner_id);
CREATE INDEX idx_recipes_title ON recipes (title);

CREATE TABLE recipe_tags
(
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    tag_id    UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

--rollback DROP TABLE recipe_tags; DROP TABLE recipes;

-- liquibase formatted sql

-- changeset recipebook:V5__add_photo_url_to_recipes
ALTER TABLE recipes ADD COLUMN photo_url VARCHAR(1000);

-- rollback ALTER TABLE recipes DROP COLUMN IF EXISTS photo_url;

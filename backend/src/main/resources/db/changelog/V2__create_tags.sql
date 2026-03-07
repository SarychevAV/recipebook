-- V2: Create tags table

CREATE TABLE tags
(
    id         UUID                     NOT NULL PRIMARY KEY,
    name       VARCHAR(50)              NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_tags_name UNIQUE (name)
);

--rollback DROP TABLE tags;
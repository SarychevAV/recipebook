-- V1: Create users table

CREATE TABLE users
(
    id         UUID                     NOT NULL PRIMARY KEY,
    username   VARCHAR(50)              NOT NULL,
    email      VARCHAR(255)             NOT NULL,
    password   VARCHAR(255)             NOT NULL,
    role       VARCHAR(20)              NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users (email);

--rollback DROP TABLE users;
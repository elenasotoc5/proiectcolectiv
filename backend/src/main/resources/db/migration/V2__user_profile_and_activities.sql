ALTER TABLE users
    ADD COLUMN bio TEXT,
    ADD COLUMN university VARCHAR(255),
    ADD COLUMN field_of_study VARCHAR(255),
    ADD COLUMN study_year INT,
    ADD COLUMN location VARCHAR(255),
    ADD COLUMN housing_type VARCHAR(100),
    ADD COLUMN avatar_url VARCHAR(500);

CREATE TABLE user_preferences (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, preference)
);

CREATE TABLE user_activities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

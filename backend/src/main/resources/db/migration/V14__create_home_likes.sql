CREATE TABLE home_likes (
                            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            home_id BIGINT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                            CONSTRAINT uq_home_likes_user_home UNIQUE (user_id, home_id)
);

CREATE INDEX idx_home_likes_user_id ON home_likes(user_id);
CREATE INDEX idx_home_likes_home_id ON home_likes(home_id);

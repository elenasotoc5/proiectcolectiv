
CREATE TABLE homes (
                       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       owner_id BIGINT NOT NULL,
                       title VARCHAR(255) NOT NULL,
                       city VARCHAR(255) NOT NULL,
                       address VARCHAR(255) NOT NULL,
                       description TEXT NOT NULL,
                       housing_type VARCHAR(100) NOT NULL,
                       guest_capacity INTEGER NOT NULL,
                       amenities TEXT[] NOT NULL DEFAULT '{}',
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                       CONSTRAINT fk_homes_owner
                           FOREIGN KEY (owner_id)
                               REFERENCES users(id),

                       CONSTRAINT chk_homes_guest_capacity
                           CHECK (guest_capacity > 0),

                       CONSTRAINT chk_homes_title
                           CHECK (LENGTH(TRIM(title)) > 0),

                       CONSTRAINT chk_homes_city
                           CHECK (LENGTH(TRIM(city)) > 0),

                       CONSTRAINT chk_homes_address
                           CHECK (LENGTH(TRIM(address)) > 0),

                       CONSTRAINT chk_homes_description
                           CHECK (LENGTH(TRIM(description)) > 0)
);

CREATE INDEX idx_homes_owner_id ON homes(owner_id);
CREATE INDEX idx_homes_city ON homes(city);

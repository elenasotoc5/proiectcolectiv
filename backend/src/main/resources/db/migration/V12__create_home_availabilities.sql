CREATE TABLE home_availabilities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    home_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    CONSTRAINT fk_home_availabilities_home
        FOREIGN KEY (home_id)
        REFERENCES homes(id),

    CONSTRAINT chk_home_availability_dates
        CHECK (end_date > start_date)
);

CREATE INDEX idx_home_availabilities_home_id
    ON home_availabilities(home_id);
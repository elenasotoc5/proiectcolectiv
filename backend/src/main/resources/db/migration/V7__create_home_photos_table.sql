
CREATE TABLE home_photos (
                             id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                             home_id BIGINT NOT NULL,
                             file_name VARCHAR(255) NOT NULL,
                             content_type VARCHAR(100) NOT NULL,
                             display_order INTEGER NOT NULL DEFAULT 0,
                             created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                             CONSTRAINT fk_home_photos_home
                                 FOREIGN KEY (home_id)
                                     REFERENCES homes(id)
                                     ON DELETE CASCADE,

                             CONSTRAINT chk_home_photos_display_order
                                 CHECK (display_order >= 0)
);

CREATE INDEX idx_home_photos_home_id
    ON home_photos(home_id);

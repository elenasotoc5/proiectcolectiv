ALTER TABLE users
    DROP COLUMN IF EXISTS university,
    DROP COLUMN IF EXISTS field_of_study,
    DROP COLUMN IF EXISTS study_year;

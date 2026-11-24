ALTER TABLE home_availabilities
DROP CONSTRAINT fk_home_availabilities_home;

ALTER TABLE home_availabilities
ADD CONSTRAINT fk_home_availabilities_home
FOREIGN KEY (home_id)
REFERENCES homes(id)
ON DELETE CASCADE;
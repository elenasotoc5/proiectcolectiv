CREATE TABLE counties (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE INDEX idx_counties_name ON counties(name);

INSERT INTO counties (code, name) VALUES
    ('AB', 'Alba'),
    ('AR', 'Arad'),
    ('AG', 'Argeș'),
    ('BC', 'Bacău'),
    ('BH', 'Bihor'),
    ('BN', 'Bistrița-Năsăud'),
    ('BT', 'Botoșani'),
    ('BV', 'Brașov'),
    ('BR', 'Brăila'),
    ('BZ', 'Buzău'),
    ('CL', 'Călărași'),
    ('CS', 'Caraș-Severin'),
    ('CJ', 'Cluj'),
    ('CT', 'Constanța'),
    ('CV', 'Covasna'),
    ('DB', 'Dâmbovița'),
    ('DJ', 'Dolj'),
    ('GL', 'Galați'),
    ('GR', 'Giurgiu'),
    ('GJ', 'Gorj'),
    ('HR', 'Harghita'),
    ('HD', 'Hunedoara'),
    ('IL', 'Ialomița'),
    ('IS', 'Iași'),
    ('IF', 'Ilfov'),
    ('MM', 'Maramureș'),
    ('MH', 'Mehedinți'),
    ('MS', 'Mureș'),
    ('NT', 'Neamț'),
    ('OT', 'Olt'),
    ('PH', 'Prahova'),
    ('SM', 'Satu Mare'),
    ('SJ', 'Sălaj'),
    ('SB', 'Sibiu'),
    ('SV', 'Suceava'),
    ('TR', 'Teleorman'),
    ('TM', 'Timiș'),
    ('TL', 'Tulcea'),
    ('VS', 'Vaslui'),
    ('VL', 'Vâlcea'),
    ('VN', 'Vrancea'),
    ('B', 'București')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

ALTER TABLE homes ADD COLUMN county VARCHAR(10);

UPDATE homes SET county = 'CJ' WHERE city ILIKE '%Cluj%';
UPDATE homes SET county = 'BV' WHERE city ILIKE '%Brasov%';
UPDATE homes SET county = 'B' WHERE city ILIKE '%Bucharest%';
UPDATE homes SET county = 'SB' WHERE city ILIKE '%Sibiu%';
UPDATE homes SET county = 'TM' WHERE city ILIKE '%Timisoara%';

UPDATE homes SET county = 'CJ' WHERE county IS NULL;

ALTER TABLE homes ALTER COLUMN county SET NOT NULL;
ALTER TABLE homes ADD CONSTRAINT fk_homes_county FOREIGN KEY (county) REFERENCES counties(code);
ALTER TABLE homes ADD CONSTRAINT chk_homes_county CHECK (LENGTH(TRIM(county)) > 0);
CREATE INDEX idx_homes_county ON homes(county);

CREATE TABLE user_preferred_counties (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    county VARCHAR(10) NOT NULL REFERENCES counties(code),
    PRIMARY KEY (user_id, county)
);

CREATE INDEX idx_user_preferred_counties_county ON user_preferred_counties(county);

INSERT INTO user_preferred_counties (user_id, county)
SELECT u.id, p.county
FROM users u
JOIN (
    VALUES
        ('elena.popescu@lifeswap.com', 'BV'),
        ('elena.popescu@lifeswap.com', 'SB'),
        ('alex.andrei@lifeswap.com', 'CJ'),
        ('alex.andrei@lifeswap.com', 'B'),
        ('sophie.martin@lifeswap.com', 'CJ'),
        ('sophie.martin@lifeswap.com', 'BV'),
        ('matei.ionescu@lifeswap.com', 'TM'),
        ('matei.ionescu@lifeswap.com', 'CJ'),
        ('clara.novak@lifeswap.com', 'SB'),
        ('clara.novak@lifeswap.com', 'BV')
) AS p(email, county) ON u.email = p.email
ON CONFLICT DO NOTHING;

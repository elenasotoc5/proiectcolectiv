-- V9__seed_initial_users_homes_activities.sql
-- Seeds sample users with complete profiles (preferences, host activities, and homes) ready for Life Swap matching.
-- Default password for all seeded users: Password123!

-- 1. Insert seed users
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    gender,
    bio,
    occupation,
    university,
    field_of_study,
    study_year,
    location,
    avatar_url
)
VALUES
    (
        'elena.popescu@lifeswap.com',
        '$2a$10$zmxeHXMwloIssIqJIarBaOTXgc.K8tNmOw/YSKQ7q6l/bGuRM2lz2',
        'Elena',
        'Popescu',
        'Female',
        'Architecture student and specialty coffee enthusiast. Love exploring historic neighborhoods, sketching streetscapes, and quiet reading in botanical gardens.',
        'Architectural Designer',
        'Technical University of Cluj-Napoca',
        'Architecture & Urban Planning',
        4,
        'Cluj-Napoca, Romania',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    ),
    (
        'alex.andrei@lifeswap.com',
        '$2a$10$zmxeHXMwloIssIqJIarBaOTXgc.K8tNmOw/YSKQ7q6l/bGuRM2lz2',
        'Alex',
        'Andrei',
        'Male',
        'Remote developer who loves mountain biking, trail running, and crisp alpine air. When not coding, I am exploring Transylvanian mountain paths.',
        'Senior Software Engineer',
        'Babes-Bolyai University',
        'Computer Science',
        3,
        'Brasov, Romania',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    ),
    (
        'sophie.martin@lifeswap.com',
        '$2a$10$zmxeHXMwloIssIqJIarBaOTXgc.K8tNmOw/YSKQ7q6l/bGuRM2lz2',
        'Sophie',
        'Martin',
        'Female',
        'French-Romanian curator passionate about contemporary art exhibitions, indie film festivals, and finding hidden courtyard cafes in historic quarters.',
        'Visual Arts Curator',
        'National University of Arts',
        'Fine Arts & Design',
        2,
        'Bucharest, Romania',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    ),
    (
        'matei.ionescu@lifeswap.com',
        '$2a$10$zmxeHXMwloIssIqJIarBaOTXgc.K8tNmOw/YSKQ7q6l/bGuRM2lz2',
        'Matei',
        'Ionescu',
        'Male',
        'Audio producer and foodie. Love cycling along the river, visiting local farmers markets, and cooking dinners for friends.',
        'Sound Designer & Music Producer',
        'Lucian Blaga University of Sibiu',
        'Performing Arts & Audio Production',
        3,
        'Sibiu, Romania',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    ),
    (
        'clara.novak@lifeswap.com',
        '$2a$10$zmxeHXMwloIssIqJIarBaOTXgc.K8tNmOw/YSKQ7q6l/bGuRM2lz2',
        'Clara',
        'Novak',
        'Female',
        'Urban ecologist passionate about sustainable cities, botanical sketching, and yoga by the Bega canal. House full of flourishing plants!',
        'Urban Ecologist',
        'Politehnica University of Timisoara',
        'Environmental Engineering',
        5,
        'Timisoara, Romania',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    )
ON CONFLICT (email) DO NOTHING;

-- 2. Insert user preferences
INSERT INTO user_preferences (user_id, preference)
SELECT u.id, p.preference
FROM users u
JOIN (
    VALUES
        ('elena.popescu@lifeswap.com', 'Coffee Culture'),
        ('elena.popescu@lifeswap.com', 'Peace & Quiet'),
        ('elena.popescu@lifeswap.com', 'Arts & Museums'),
        ('elena.popescu@lifeswap.com', 'Remote Worker'),

        ('alex.andrei@lifeswap.com', 'Tech & Coding'),
        ('alex.andrei@lifeswap.com', 'Hiking & Outdoors'),
        ('alex.andrei@lifeswap.com', 'Cycling'),
        ('alex.andrei@lifeswap.com', 'Active & On-the-Go'),

        ('sophie.martin@lifeswap.com', 'Arts & Museums'),
        ('sophie.martin@lifeswap.com', 'Film & Cinema'),
        ('sophie.martin@lifeswap.com', 'Food & Dining Out'),
        ('sophie.martin@lifeswap.com', 'Social & Extrovert'),

        ('matei.ionescu@lifeswap.com', 'Music & Concerts'),
        ('matei.ionescu@lifeswap.com', 'Cooking & Foodie'),
        ('matei.ionescu@lifeswap.com', 'Peace & Quiet'),
        ('matei.ionescu@lifeswap.com', 'Cycling'),

        ('clara.novak@lifeswap.com', 'Yoga & Wellness'),
        ('clara.novak@lifeswap.com', 'Hiking & Outdoors'),
        ('clara.novak@lifeswap.com', 'Remote Worker'),
        ('clara.novak@lifeswap.com', 'Early Bird')
) AS p(email, preference)
ON u.email = p.email
ON CONFLICT (user_id, preference) DO NOTHING;

-- 3. Insert user host activities
INSERT INTO user_activities (user_id, title, description, category)
SELECT u.id, a.title, a.description, a.category
FROM users u
JOIN (
    VALUES
        (
            'elena.popescu@lifeswap.com',
            'Old Town Architecture Walk & Specialty Coffee Crawl',
            'A scenic stroll through Cluj''s historic centre highlighting neoclassical facades, followed by tastings at my favourite local roasteries.',
            'Food, Coffee & Dining'
        ),
        (
            'elena.popescu@lifeswap.com',
            'Central Park Morning Run & Botanical Garden Tour',
            'Start the day jogging by the lake and exploring the greenhouse collection at Alexandru Borza Botanical Garden.',
            'Outdoors & Nature'
        ),
        (
            'alex.andrei@lifeswap.com',
            'Tampa Mountain Sunset Hike & Panoramic View',
            'An energetic 45-minute hike up Mount Tampa overlooking the medieval rooftops of Brasov, ending with a view from the iconic city sign.',
            'Outdoors & Nature'
        ),
        (
            'alex.andrei@lifeswap.com',
            'Postavaru Trail Ride & Craft Beer Tasting',
            'Mountain bike descent through wooded paths towards Poiana Brasov, followed by artisan local brews in the Council Square.',
            'Sports & Fitness'
        ),
        (
            'sophie.martin@lifeswap.com',
            'Cotroceni Historic Villa Tour & Tea Tasting',
            'An insider stroll through the quiet Cotroceni neighborhood exploring interwar villas, followed by a tea tasting at Infinitea garden.',
            'Culture & Arts'
        ),
        (
            'sophie.martin@lifeswap.com',
            'Contemporary Art Gallery Hop & Wine Evening',
            'Visit independent art galleries around Calea Victoriei and conclude with natural Romanian wine at a cozy local bar.',
            'Nightlife & Social'
        ),
        (
            'matei.ionescu@lifeswap.com',
            'Sibiu Old Town Rooftop & Citadel Bastion Walk',
            'Explore the medieval towers, defensive walls, and the iconic "eyes of Sibiu" roof windows, with stops for artisanal pastry.',
            'Local Gems & Neighborhood'
        ),
        (
            'matei.ionescu@lifeswap.com',
            'Astra Folk Museum Biking & Traditional Lunch',
            'A peaceful bike ride through the open-air Astra Museum in Dumbrava Forest, including traditional Transylvanian dumplings.',
            'Food, Coffee & Dining'
        ),
        (
            'clara.novak@lifeswap.com',
            'Bega Canal Kayaking & Riverside Yoga',
            'A tranquil morning paddle along the Bega canal followed by a gentle yoga session on the grassy banks of Roses Park.',
            'Sports & Fitness'
        ),
        (
            'clara.novak@lifeswap.com',
            'Fabric Quarter Architectural Sketching & Craft Market',
            'Discover the Secession and Austro-Hungarian architecture of the Fabric district, stopping at local artisan workshops.',
            'Culture & Arts'
        )
) AS a(email, title, description, category)
ON u.email = a.email
WHERE NOT EXISTS (
    SELECT 1 FROM user_activities act
    WHERE act.user_id = u.id AND act.title = a.title
);

-- 4. Insert homes (1 home per user)
INSERT INTO homes (
    owner_id,
    title,
    city,
    address,
    description,
    housing_type,
    guest_capacity,
    amenities
)
SELECT
    u.id,
    h.title,
    h.city,
    h.address,
    h.description,
    h.housing_type,
    h.guest_capacity,
    h.amenities
FROM users u
JOIN (
    VALUES
        (
            'elena.popescu@lifeswap.com',
            'Sunlit Bohemian Loft near Central Park',
            'Cluj-Napoca',
            'Strada Gheorghe Sincai 12',
            'Bright, high-ceiling loft filled with plants, natural light, and a dedicated workspace. Steps away from Central Park, cozy coffee shops, and tram lines.',
            'Townhouse / Loft',
            2,
            ARRAY['Fast Wi-Fi', 'Dedicated Workspace', 'Balcony', 'Espresso Machine', 'Washing Machine', 'Air Conditioning', 'Dishwasher']::TEXT[]
        ),
        (
            'alex.andrei@lifeswap.com',
            'Modern Mountain View Apartment in Medieval Center',
            'Brasov',
            'Strada Republicii 45',
            'Charming restored historic apartment with exposed timber beams and breathtaking vistas of Mount Tampa. Fast fiber optic internet perfect for remote work.',
            'Entire Apartment',
            3,
            ARRAY['Fast Wi-Fi', 'Mountain View', 'Dedicated Workspace', 'Smart TV', 'Heating', 'Bicycle Storage', 'Kitchen']::TEXT[]
        ),
        (
            'sophie.martin@lifeswap.com',
            'Art Deco Studio on Calea Victoriei',
            'Bucharest',
            'Calea Victoriei 102, Apt 14',
            'Stylishly curated Art Deco studio situated right in the cultural heart of Bucharest. High ceilings, vintage furnishings, and acoustic double glazing.',
            'Studio Apartment',
            2,
            ARRAY['Fast Wi-Fi', 'Air Conditioning', 'Coffee Maker', 'Elevator', 'City View', 'Hair Dryer', 'Kitchenette']::TEXT[]
        ),
        (
            'matei.ionescu@lifeswap.com',
            'Cozy Historic Townhouse in Lower Town',
            'Sibiu',
            'Strada Turnului 8',
            'A charming 18th-century cobblestone townhouse with a private brick courtyard, modern kitchen, and vinyl record collection. Steps away from the Bridge of Lies.',
            'House / Villa',
            4,
            ARRAY['Fast Wi-Fi', 'Private Courtyard', 'Fireplace', 'Sound System', 'Fully Equipped Kitchen', 'Washing Machine', 'Free Street Parking']::TEXT[]
        ),
        (
            'clara.novak@lifeswap.com',
            'Green Oasis Penthouse overlooking Bega River',
            'Timisoara',
            'Bulevardul Vasile Parvan 18',
            'Spacious penthouse terrace overflowing with potted flowers, panoramic river views, and an open-concept kitchen. Peaceful, sunny, and central.',
            'Suburban Home with Garden',
            3,
            ARRAY['Fast Wi-Fi', 'Large Terrace', 'River View', 'Dedicated Workspace', 'Dishwasher', 'Air Conditioning', 'Bathtub']::TEXT[]
        )
) AS h(email, title, city, address, description, housing_type, guest_capacity, amenities)
ON u.email = h.email
WHERE NOT EXISTS (
    SELECT 1 FROM homes hm WHERE hm.owner_id = u.id
);

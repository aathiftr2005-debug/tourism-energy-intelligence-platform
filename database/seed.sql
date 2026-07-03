-- =============================================================================
-- Tourism Energy Intelligence — Seed Data
-- =============================================================================

-- ── Countries ────────────────────────────────────────────────────────────────

INSERT INTO countries (code, name, region, latitude, longitude) VALUES
    ('DE', 'Germany',       'Western Europe',  51.1657,  10.4515),
    ('FR', 'France',        'Western Europe',  46.6034,   1.8883),
    ('ES', 'Spain',         'Southern Europe', 40.4637,  -3.7492),
    ('IT', 'Italy',         'Southern Europe', 41.8719,  12.5674),
    ('AT', 'Austria',       'Central Europe',  47.5162,  14.5501),
    ('GR', 'Greece',        'Southern Europe', 39.0742,  21.8243),
    ('PT', 'Portugal',      'Southern Europe', 39.3999,  -8.2245),
    ('NL', 'Netherlands',   'Western Europe',  52.1326,   5.2913),
    ('BE', 'Belgium',       'Western Europe',  50.8503,   4.3517),
    ('CZ', 'Czech Republic','Central Europe',  49.8175,  15.4730),
    ('GB', 'United Kingdom','Western Europe',  55.3781,  -3.4360),
    ('CH', 'Switzerland',   'Central Europe',  46.8182,   8.2275),
    ('SE', 'Sweden',        'Northern Europe', 60.1282,  18.6435),
    ('NO', 'Norway',        'Northern Europe', 60.4720,   8.4689),
    ('DK', 'Denmark',       'Northern Europe', 56.2639,   9.5018),
    ('FI', 'Finland',       'Northern Europe', 61.9241,  25.7482),
    ('IE', 'Ireland',       'Western Europe',  53.4129,  -8.2439),
    ('PL', 'Poland',        'Central Europe',  51.9194,  19.1451),
    ('HU', 'Hungary',       'Central Europe',  47.1625,  19.5033),
    ('RO', 'Romania',       'Eastern Europe',  45.9432,  24.9668),
    ('BG', 'Bulgaria',      'Eastern Europe',  42.7339,  25.4858),
    ('HR', 'Croatia',       'Southern Europe', 45.1000,  15.2000)
ON CONFLICT (code) DO NOTHING;

-- ── Demo Users ──────────────────────────────────────────────────────────────

-- Passwords are bcrypt hashes of 'demo1234'
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@tei.app',    '$2b$12$LJ3m4ys3Lk0TSwHnbfOMe.XJrGhWlJkX3KrlLk0TSwHnbfOMe.XJ', 'Admin User',        'admin'),
    ('analyst@tei.app',  '$2b$12$LJ3m4ys3Lk0TSwHnbfOMe.XJrGhWlJkX3KrlLk0TSwHnbfOMe.XJ', 'Government Analyst', 'analyst'),
    ('operator@tei.app', '$2b$12$LJ3m4ys3Lk0TSwHnbfOMe.XJrGhWlJkX3KrlLk0TSwHnbfOMe.XJ', 'Energy Operator',    'operator'),
    ('viewer@tei.app',   '$2b$12$LJ3m4ys3Lk0TSwHnbfOMe.XJrGhWlJkX3KrlLk0TSwHnbfOMe.XJ', 'Viewer User',        'viewer')
ON CONFLICT (email) DO NOTHING;

-- Every category stores its own color and icon. The API checks only their
-- form (a six-digit hex color, a non-blank icon name); which colors and
-- icons are offered is the web's business, so deliberately no CHECK here.
ALTER TABLE category ADD COLUMN color TEXT, ADD COLUMN icon TEXT;

-- The seeded categories, matched by name for the last time: renaming
-- arrives with this migration, so no name can have changed before it runs.
UPDATE category c
SET color = seed.color, icon = seed.icon
FROM (VALUES
    ('Salary',        '#3dbb76', 'banknote'),
    ('Gift',          '#b6e06a', 'gift'),
    ('Housing',       '#6b8cff', 'home'),
    ('Groceries',     '#f5c451', 'cart'),
    ('Eating out',    '#ff9f6b', 'cutlery'),
    ('Transport',     '#9accff', 'bus'),
    ('Utilities',     '#c3aeff', 'bolt'),
    ('Health',        '#ff9bc2', 'heart'),
    ('Entertainment', '#3ccbb8', 'play'),
    ('Other',         '#a9ad6f', 'tag')
) AS seed (name, color, icon)
WHERE c.name = seed.name;

-- Everything else was created by the user. Each gets the generic icon and
-- the color the web would have handed it at creation: the two fixed colors
-- the seed leaves unused, then the fixed set from its start, in creation
-- order. A snapshot of the web's fixed set, never read again.
WITH fixed (position, color) AS (VALUES
    (0,  '#6b8cff'), (1,  '#f5c451'), (2,  '#ff9f6b'), (3,  '#9accff'),
    (4,  '#c3aeff'), (5,  '#ff9bc2'), (6,  '#3ccbb8'), (7,  '#3dbb76'),
    (8,  '#b6e06a'), (9,  '#e58be0'), (10, '#d9b38c'), (11, '#a9ad6f')
),
created AS (
    SELECT id, row_number() OVER (ORDER BY id) - 1 AS n
    FROM category
    WHERE color IS NULL
)
UPDATE category c
SET icon = 'tag', color = fixed.color
FROM created
JOIN fixed ON fixed.position = CASE
    WHEN created.n < 2 THEN created.n + 9
    ELSE (created.n - 2) % 12
END
WHERE c.id = created.id;

ALTER TABLE category
    ALTER COLUMN color SET NOT NULL,
    ALTER COLUMN icon SET NOT NULL;

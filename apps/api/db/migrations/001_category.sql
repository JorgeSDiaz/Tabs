CREATE TABLE category (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    sort_order INTEGER NOT NULL,
    -- Unusual on its own (id is the PK), required as the composite FK
    -- target in the movement table: it is only valid when both ids exist
    -- AND the directions match, so an unknown id or a wrong-direction
    -- pair is physically unwritable.
    UNIQUE (id, direction)
);

INSERT INTO category (name, direction, sort_order) VALUES
    ('Salary',        'in',  1),
    ('Gift',          'in',  2),
    ('Housing',       'out', 3),
    ('Groceries',     'out', 4),
    ('Eating out',    'out', 5),
    ('Transport',     'out', 6),
    ('Utilities',     'out', 7),
    ('Health',        'out', 8),
    ('Entertainment', 'out', 9),
    ('Other',         'out', 10);

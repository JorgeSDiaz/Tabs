CREATE TABLE category (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL
);

INSERT INTO category (name, sort_order) VALUES
    ('Income', 1),
    ('Housing', 2),
    ('Groceries', 3),
    ('Eating out', 4),
    ('Transport', 5),
    ('Health', 6),
    ('Entertainment', 7),
    ('Subscriptions', 8),
    ('Shopping', 9),
    ('Other', 10);

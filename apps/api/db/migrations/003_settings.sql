CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    boundary_day INTEGER NOT NULL,
    timezone TEXT NOT NULL
);

INSERT INTO settings (id, boundary_day, timezone)
VALUES (1, 30, 'America/Bogota');

-- A direction's catch-all lists after every other category of that
-- direction, however many are created later. The flag is read only by the
-- list query's ORDER BY; nothing in the API can set it. It is matched by
-- name this once, while no category can have been renamed yet.
ALTER TABLE category ADD COLUMN catch_all BOOLEAN NOT NULL DEFAULT false;

UPDATE category SET catch_all = true WHERE name = 'Other' AND direction = 'out';

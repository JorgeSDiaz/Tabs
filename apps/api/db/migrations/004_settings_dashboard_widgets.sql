-- The user's dashboard widget selection, stored as a JSON object mapping
-- widget id to boolean. Nullable on purpose: NULL means "never chosen", so
-- the API serves its all-enabled defaults. Key validation lives in the Go
-- dashboard domain (one rule, one place), so deliberately no CHECK here.
ALTER TABLE settings ADD COLUMN dashboard_widgets JSONB;

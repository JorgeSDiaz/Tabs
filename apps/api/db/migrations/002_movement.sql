CREATE TABLE movement (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    amount_cents BIGINT NOT NULL,
    direction TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES category (id),
    occurred_on DATE NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Plain FK above rejects unknown ids; this composite FK is the single
    -- place the movement-category direction pairing is enforced: it is only
    -- valid when both ids exist AND the directions match.
    CONSTRAINT movement_category_direction_fkey
        FOREIGN KEY (category_id, direction) REFERENCES category (id, direction)
);

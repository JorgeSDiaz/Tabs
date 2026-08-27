CREATE TABLE movement (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    amount_cents BIGINT NOT NULL,
    direction TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES category (id),
    occurred_on DATE NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

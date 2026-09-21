-- Every category belongs to one of the two movement directions. The
-- composite FK below is the single place the movement-category pairing is
-- enforced: it is only valid when both ids exist AND the directions match,
-- so an unknown id or a wrong-direction pair is physically unwritable.
ALTER TABLE category
    ADD COLUMN direction TEXT CHECK (direction IN ('in', 'out'));

UPDATE category SET direction = 'in'  WHERE name = 'Income';
UPDATE category SET direction = 'out' WHERE name <> 'Income';

ALTER TABLE category ALTER COLUMN direction SET NOT NULL;

INSERT INTO category (name, sort_order, direction) VALUES
    ('Salary', 11, 'in'),
    ('Bonus', 12, 'in'),
    ('Reimbursement', 13, 'in'),
    ('Gift', 14, 'in');

-- Unusual on its own (id is the PK), required as the composite FK target.
ALTER TABLE category ADD CONSTRAINT category_id_direction_unique UNIQUE (id, direction);

ALTER TABLE movement
    ADD CONSTRAINT movement_category_direction_fkey
        FOREIGN KEY (category_id, direction) REFERENCES category (id, direction);

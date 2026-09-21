# Spec Delta

## REMOVED Requirements

### Requirement: Seeded categories
**Reason**: The category set is now a capability of its own (`categories`),
which specs the replacement seed and the creation flow this requirement
explicitly excluded. The direction pairing between a movement and its
category remains fully covered by "Record a movement" in this capability,
which is unchanged.
**Migration**: See the `categories` spec delta in this change for the
seeded set and its direction coverage; the sentence "This change does not
let the user create, rename, or deactivate categories" is superseded —
creation is allowed, rename and delete are not.

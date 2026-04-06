# Claude Project Rules

## Mandatory: Keep `CREDITS.md` Updated

When you modify `models/` in any way (add/remove/replace/rename `.glb` files), you must:

1. Update `CREDITS.md` in the same commit.
2. Record source, creator, and license for each new third-party asset.
3. Remove or mark obsolete entries for deleted assets.

Do not ship model changes without updating attribution records.

## License Safety

- Prefer `CC0` assets when possible.
- If using `CC BY` or similar attribution licenses, include complete attribution fields in `CREDITS.md`.
- If license is unclear, do not import the asset until provenance is confirmed.

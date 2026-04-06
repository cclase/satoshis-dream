# Asset Credits

This file is the source of truth for 3D asset attribution and licensing.

## Maintenance Rule

If any file in `models/` is added, removed, or replaced, this file must be updated in the same commit.

## Current Asset Set

As of April 6, 2026, the checked-in `.glb` files in `models/` were generated in-repo by project scripts and do not currently include imported third-party storefront assets.

Latest regeneration in this commit:

- `scripts/generate_building_overhaul.py` was updated and re-run to replace all major building and character models with higher-detail procedural meshes (facade bands, recessed entries, rounded corner masses, expanded roof details, and richer character anatomy).
- A follow-up pass further overhauled prop/tree assets (street furniture, hydrants, planters, bus stops, lamps, and trees) and corrected local mesh rotation behavior in the generator for consistent placement.

Primary generation scripts:

- `scripts/generate_building_overhaul.py`
- `scripts/trellis_batch_generate.py` (pipeline script; outputs may vary by run)

## Attribution Template (Use For Any Third-Party Asset)

For each imported third-party model, add one entry with:

- `Asset`: file path in `models/`
- `Title`: original asset title
- `Creator`: author/publisher
- `License`: exact license name (`CC0`, `CC BY 4.0`, etc.)
- `License URL`: direct license link
- `Source URL`: direct model page/download source
- `Modified`: `yes` or `no`
- `Notes`: optional extra context

Example row format:

| Asset | Title | Creator | License | License URL | Source URL | Modified | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `models/example.glb` | Example Building | Jane Doe | CC BY 4.0 | `https://creativecommons.org/licenses/by/4.0/` | `https://example.com/model` | yes | Reduced polycount, merged materials |

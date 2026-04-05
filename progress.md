Original prompt: Drastically improve the in-game building models to look and feel more real, with upgraded character models.

- 2026-04-05: Deploy blocker fixed previously (Pages workflow now passing).
- 2026-04-05 (current): Starting full geometry rewrite for building and character GLB generation to remove blocky "stacked cubes" look.
- 2026-04-05: Replaced `scripts/generate_building_overhaul.py` with archetype-based geometry builders (setbacks, gables, columns, cylindrical volumes, canopies, and facade depth).
- 2026-04-05: Regenerated all building, prop, tree, and character GLB files using the new generator.
- 2026-04-05: Removed obsolete generator `scripts/generate_recreated_v2.py` and deleted empty `models/recreated_v2` folder.
- 2026-04-05: Full test suite passed (`349/349`).

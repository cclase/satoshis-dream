Original prompt: Drastically improve the in-game building models to look and feel more real, with upgraded character models.

- 2026-04-05: Deploy blocker fixed previously (Pages workflow now passing).
- 2026-04-05 (current): Starting full geometry rewrite for building and character GLB generation to remove blocky "stacked cubes" look.
- 2026-04-05: Replaced `scripts/generate_building_overhaul.py` with archetype-based geometry builders (setbacks, gables, columns, cylindrical volumes, canopies, and facade depth).
- 2026-04-05: Regenerated all building, prop, tree, and character GLB files using the new generator.
- 2026-04-05: Removed obsolete generator `scripts/generate_recreated_v2.py` and deleted empty `models/recreated_v2` folder.
- 2026-04-05: Full test suite passed (`349/349`).
- 2026-04-05 (late): Second overhaul pass added higher-detail facades and silhouette variation across all archetypes (window bands, towers, balconies, canopies, pilasters, roof equipment).
- 2026-04-05 (late): Town lot pad colors in `town.js` were desaturated to neutral concrete/asphalt tones to reduce toy-like colored square pads.
- 2026-04-05 (late): Full test suite still passes (`349/349`) after second pass.
- 2026-04-07: Implemented first-hour retention overhaul. Added objective/milestone progression state, building gating/unlocks, first-visit USD rewards, starter delivery reward path, scripted early NPC event, Craig race hooks, and save migration for advanced saves.
- 2026-04-07: Updated HUD/nav/town presentation for the new flow. Spawn now starts near Mining HQ, objective bar is pinned in the HUD, locked buildings stay visible but inaccessible, and nav entries show lock-state messaging instead of free teleport access.
- 2026-04-07: Expanded test coverage for the retention flow. `npm test` now passes at `359/359`, including objective progression, unlock rewards, first-visit rewards, and advanced-save migration.
- 2026-04-07: Browser-verified onboarding path on local build: avatar creation -> Mining HQ -> first sell -> hardware unlock -> desktop purchase -> starter delivery -> diner completion. Output artifacts saved under `output/retention-playtest-*`.

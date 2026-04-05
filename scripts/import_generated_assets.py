#!/usr/bin/env python3
"""
Import generated .glb assets into models/ and optionally clean unused files.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


def load_manifest(path: Path) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [row["file"] for row in data if isinstance(row, dict) and "file" in row]


def referenced_glbs_from_town_js(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r"'([A-Za-z0-9_\-]+\.glb)'", text))


def main() -> int:
    parser = argparse.ArgumentParser(description="Import generated TRELLIS assets into models/")
    parser.add_argument("--manifest", type=Path, default=Path("scripts/trellis_asset_manifest.json"))
    parser.add_argument("--generated-dir", type=Path, default=Path("generated_models"))
    parser.add_argument("--models-dir", type=Path, default=Path("models"))
    parser.add_argument("--town-js", type=Path, default=Path("town.js"))
    parser.add_argument("--clean-unused", action="store_true")
    args = parser.parse_args()

    manifest_files = load_manifest(args.manifest)
    args.models_dir.mkdir(parents=True, exist_ok=True)

    copied = []
    missing = []
    for file_name in manifest_files:
        src = args.generated_dir / file_name
        dst = args.models_dir / file_name
        if src.exists():
            shutil.copy2(src, dst)
            copied.append(file_name)
        else:
            missing.append(file_name)

    print(f"Copied {len(copied)} file(s) to {args.models_dir}")
    if missing:
        print("Missing generated files:")
        for name in missing:
            print(f"  - {name}")

    if args.clean_unused:
        referenced = referenced_glbs_from_town_js(args.town_js)
        removed = []
        for glb in args.models_dir.glob("*.glb"):
            if glb.name not in referenced:
                glb.unlink()
                removed.append(glb.name)
        print(f"Removed {len(removed)} unused file(s) from models/")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

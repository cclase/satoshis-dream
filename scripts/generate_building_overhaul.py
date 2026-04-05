import math
from pathlib import Path

import numpy as np
import trimesh


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"


def hex_rgba(color_hex: str, alpha: int = 255):
    h = color_hex.strip().lstrip("#")
    return [int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha]


def box(extents, center, color_hex):
    mesh = trimesh.creation.box(extents=extents)
    mesh.apply_translation(center)
    mesh.visual.face_colors = np.tile(np.array(hex_rgba(color_hex), dtype=np.uint8), (len(mesh.faces), 1))
    return mesh


def add_window_grid(parts, *, width, height, depth, floors, cols, y0, color="#89b8d8", frame="#2a3440"):
    pane_w = width / (cols + 2.5)
    pane_h = height / (floors + 2.0)
    z = depth / 2 + 0.03
    for r in range(floors):
        for c in range(cols):
            x = -width / 2 + (c + 1.2) * (width / (cols + 1.5))
            y = y0 + (r + 0.7) * (height / (floors + 1.2))
            parts.append(box([pane_w * 1.02, pane_h * 1.02, 0.05], [x, y, z], frame))
            parts.append(box([pane_w * 0.84, pane_h * 0.84, 0.06], [x, y, z + 0.01], color))


def add_roof_units(parts, *, width, depth, y, color="#7d7f86"):
    offsets = [
        (-width * 0.2, -depth * 0.15),
        (width * 0.18, -depth * 0.1),
        (0.0, depth * 0.2),
    ]
    for ox, oz in offsets:
        parts.append(box([width * 0.16, 0.16, depth * 0.14], [ox, y + 0.08, oz], color))
        parts.append(box([width * 0.08, 0.08, depth * 0.08], [ox, y + 0.18, oz], "#b8bcc4"))


def add_column_portico(parts, *, width, depth, y, count=4, color="#d8d5c8", roof="#b5ae98"):
    spacing = width / (count + 1)
    z = depth / 2 + 0.12
    for i in range(count):
        x = -width / 2 + (i + 1) * spacing
        parts.append(box([0.12, y * 0.75, 0.12], [x, (y * 0.75) / 2, z], color))
    parts.append(box([width * 0.82, 0.1, 0.32], [0, y * 0.76 + 0.05, z], roof))


def build_model(cfg):
    w = cfg["w"]
    h = cfg["h"]
    d = cfg["d"]
    wall = cfg["wall"]
    roof = cfg["roof"]
    accent = cfg["accent"]
    parts = []

    # Main shell + roof cap
    parts.append(box([w, h, d], [0, h / 2, 0], wall))
    parts.append(box([w * 1.04, 0.08, d * 1.04], [0, h + 0.04, 0], roof))

    # Front door + trim
    door_h = h * 0.34
    parts.append(box([w * 0.16, door_h, 0.06], [0, door_h / 2, d / 2 + 0.04], "#3a2f2a"))
    parts.append(box([w * 0.22, 0.06, 0.08], [0, door_h + 0.03, d / 2 + 0.05], accent))

    # Generic windows
    add_window_grid(
        parts,
        width=w * 0.9,
        height=h * 0.68,
        depth=d,
        floors=cfg.get("floors", 2),
        cols=cfg.get("cols", 4),
        y0=h * 0.18,
        color=cfg.get("glass", "#86b8d6"),
        frame=cfg.get("frame", "#2b323c"),
    )

    # Side wings
    if cfg.get("wings"):
        wing_h = h * 0.72
        wing_w = w * 0.28
        wing_d = d * 0.88
        parts.append(box([wing_w, wing_h, wing_d], [-w * 0.42, wing_h / 2, 0], wall))
        parts.append(box([wing_w, wing_h, wing_d], [w * 0.42, wing_h / 2, 0], wall))
        parts.append(box([wing_w * 1.03, 0.08, wing_d * 1.03], [-w * 0.42, wing_h + 0.04, 0], roof))
        parts.append(box([wing_w * 1.03, 0.08, wing_d * 1.03], [w * 0.42, wing_h + 0.04, 0], roof))

    # Tower feature
    if cfg.get("tower"):
        tw = w * 0.28
        th = h * 0.85
        td = d * 0.28
        parts.append(box([tw, th, td], [0, h + th / 2, -d * 0.18], accent))
        parts.append(box([tw * 1.06, 0.1, td * 1.06], [0, h + th + 0.05, -d * 0.18], roof))
        parts.append(box([tw * 0.42, th * 0.5, td * 0.2], [0, h + th * 0.45, -d * 0.02], "#2b3442"))

    # Portico columns
    if cfg.get("portico"):
        add_column_portico(parts, width=w * 0.7, depth=d, y=h * 0.6, count=cfg.get("columns", 4), color=cfg.get("portico_color", "#dad8ce"), roof=roof)

    # Canopy / awning
    if cfg.get("awning"):
        parts.append(box([w * 0.64, 0.06, 0.34], [0, h * 0.42, d / 2 + 0.16], accent))
        parts.append(box([w * 0.58, 0.03, 0.28], [0, h * 0.39, d / 2 + 0.17], cfg.get("awning2", "#f3dcb0")))

    # Neon band / sign mass
    if cfg.get("band"):
        parts.append(box([w * 0.92, 0.09, 0.08], [0, h * 0.78, d / 2 + 0.05], accent))

    # Roof machinery
    if cfg.get("roof_units", True):
        add_roof_units(parts, width=w, depth=d, y=h + 0.08, color=cfg.get("roof_unit_color", "#7f838b"))

    # Distinctive objects by type
    if cfg.get("dish"):
        parts.append(box([0.32, 0.04, 0.32], [w * 0.2, h + 0.28, -d * 0.1], "#c9cbd0"))
        parts.append(box([0.04, 0.26, 0.04], [w * 0.2, h + 0.16, -d * 0.1], "#7f848d"))
    if cfg.get("cross"):
        parts.append(box([0.12, 0.5, 0.07], [0, h + 0.34, d * 0.03], "#cf3f46"))
        parts.append(box([0.36, 0.12, 0.07], [0, h + 0.34, d * 0.03], "#cf3f46"))
    if cfg.get("slots"):
        for i in range(4):
            x = -w * 0.28 + i * w * 0.19
            parts.append(box([w * 0.12, 0.22, 0.08], [x, h * 0.22, d / 2 + 0.06], "#2a2f39"))

    mesh = trimesh.util.concatenate(parts)
    return mesh


def export_model(filename, cfg):
    mesh = build_model(cfg)
    out_path = MODELS_DIR / filename
    out_path.write_bytes(trimesh.exchange.gltf.export_glb(mesh))


def build_character(*, shirt, pants, skin, hair, accent, taller=False):
    parts = []
    scale = 1.12 if taller else 1.0

    # Legs
    parts.append(box([0.14, 0.52 * scale, 0.14], [-0.1, 0.26 * scale, 0], pants))
    parts.append(box([0.14, 0.52 * scale, 0.14], [0.1, 0.26 * scale, 0], pants))
    # Torso + hips
    parts.append(box([0.4, 0.18 * scale, 0.22], [0, 0.62 * scale, 0], pants))
    parts.append(box([0.46, 0.5 * scale, 0.24], [0, 0.96 * scale, 0], shirt))
    # Arms
    parts.append(box([0.12, 0.42 * scale, 0.12], [-0.3, 0.98 * scale, 0], skin))
    parts.append(box([0.12, 0.42 * scale, 0.12], [0.3, 0.98 * scale, 0], skin))
    # Head + hair
    parts.append(box([0.3, 0.32 * scale, 0.28], [0, 1.42 * scale, 0], skin))
    parts.append(box([0.32, 0.1 * scale, 0.3], [0, 1.58 * scale, -0.01], hair))
    parts.append(box([0.12, 0.08 * scale, 0.08], [0, 1.42 * scale, 0.15], accent))
    # Shoes
    parts.append(box([0.17, 0.08 * scale, 0.22], [-0.1, 0.04 * scale, 0.03], "#1f2124"))
    parts.append(box([0.17, 0.08 * scale, 0.22], [0.1, 0.04 * scale, 0.03], "#1f2124"))

    mesh = trimesh.util.concatenate(parts)
    bounds = mesh.bounds
    mesh.apply_translation([0, -bounds[0][1], 0])
    return mesh


def export_character(filename, **kwargs):
    mesh = build_character(**kwargs)
    out_path = MODELS_DIR / filename
    out_path.write_bytes(trimesh.exchange.gltf.export_glb(mesh))


def main():
    configs = {
        "mine_hq.glb": dict(w=1.55, h=0.95, d=1.25, wall="#55667a", roof="#2f3a46", accent="#f19a33", floors=3, cols=5, wings=True, band=True, dish=True),
        "hardware_shop.glb": dict(w=1.35, h=0.82, d=1.05, wall="#586f86", roof="#2f3a46", accent="#4f9de6", floors=2, cols=5, awning=True, band=True),
        "exchange.glb": dict(w=1.3, h=0.86, d=1.0, wall="#6f7e89", roof="#2d3946", accent="#2fbe84", floors=3, cols=6, band=True),
        "bank.glb": dict(w=1.55, h=1.05, d=1.2, wall="#c7bda7", roof="#9b927d", accent="#c9a545", floors=3, cols=5, portico=True, columns=5, tower=True, roof_units=False),
        "diner.glb": dict(w=1.28, h=0.68, d=0.95, wall="#9a4c43", roof="#5a2727", accent="#e56155", floors=1, cols=5, awning=True, band=True),
        "coffee_shop.glb": dict(w=1.12, h=0.68, d=0.9, wall="#8e7a63", roof="#4d4034", accent="#cc9a62", floors=1, cols=4, awning=True, awning2="#e6d3b0"),
        "university.glb": dict(w=1.58, h=0.96, d=1.28, wall="#8d7c93", roof="#5c4b66", accent="#d7d2cc", floors=3, cols=5, tower=True, wings=True, roof_units=False),
        "hospital.glb": dict(w=1.42, h=0.92, d=1.1, wall="#d4d8df", roof="#6f7a88", accent="#cf3f46", floors=3, cols=6, cross=True, band=True),
        "internet_cafe.glb": dict(w=1.25, h=0.74, d=0.96, wall="#365561", roof="#1b2e37", accent="#2fd9d4", floors=2, cols=5, band=True),
        "casino.glb": dict(w=1.6, h=0.9, d=1.22, wall="#7a3447", roof="#4a1f2f", accent="#f2b53f", floors=2, cols=6, band=True, slots=True),
        "post_office.glb": dict(w=1.35, h=0.8, d=1.0, wall="#8e97a6", roof="#505865", accent="#3f6cb3", floors=2, cols=4, portico=True, columns=4),
        "gym.glb": dict(w=1.26, h=0.74, d=0.96, wall="#626a74", roof="#3f464f", accent="#e7843e", floors=2, cols=6, band=True),
        "real_estate_office.glb": dict(w=1.28, h=0.72, d=0.95, wall="#7d8c7b", roof="#4e5b4d", accent="#4aa865", floors=2, cols=4, awning=True),
        "pet_shop.glb": dict(w=1.18, h=0.7, d=0.9, wall="#b48b84", roof="#6a4d48", accent="#ff8aa6", floors=2, cols=4, awning=True),
        "pawn_shop.glb": dict(w=1.15, h=0.72, d=0.9, wall="#6d5f4a", roof="#43392c", accent="#d6aa3d", floors=1, cols=3, band=True),
        "bitcoin_atm.glb": dict(w=1.05, h=0.78, d=0.84, wall="#5e6874", roof="#333b46", accent="#f6a623", floors=2, cols=3, roof_units=False),
        "clothing_store.glb": dict(w=1.3, h=0.75, d=0.95, wall="#8f6f7a", roof="#5a4550", accent="#e89bb4", floors=2, cols=5, awning=True),
        "apartment_building.glb": dict(w=1.18, h=1.15, d=0.98, wall="#83786e", roof="#58504b", accent="#c9a783", floors=5, cols=4, band=True),
        "furniture_store.glb": dict(w=1.35, h=0.8, d=1.02, wall="#788267", roof="#4d5642", accent="#a0bf68", floors=2, cols=5, awning=True),
        "building-garage.glb": dict(w=1.2, h=0.62, d=0.95, wall="#6f7278", roof="#43474d", accent="#9098a3", floors=1, cols=2, roof_units=False),
    }

    for name, cfg in configs.items():
        export_model(name, cfg)
        print(f"generated: {name}")

    export_character(
        "avatar_player.glb",
        shirt="#f1a33d",
        pants="#2e3b48",
        skin="#d6ac84",
        hair="#4a3a2d",
        accent="#ffcf57",
        taller=False,
    )
    print("generated: avatar_player.glb")

    export_character(
        "npc_craig.glb",
        shirt="#7a2e37",
        pants="#2c2f38",
        skin="#c89d79",
        hair="#2f2520",
        accent="#d84c54",
        taller=True,
    )
    print("generated: npc_craig.glb")


if __name__ == "__main__":
    main()

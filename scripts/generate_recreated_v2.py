from pathlib import Path
import numpy as np
import trimesh


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "models"
OUT.mkdir(parents=True, exist_ok=True)


def rgba(hex_color, a=255):
    h = hex_color.lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a], dtype=np.uint8)


def cbox(extents, center, color):
    m = trimesh.creation.box(extents=extents)
    m.apply_translation(center)
    m.visual.face_colors = np.tile(rgba(color), (len(m.faces), 1))
    return m


def cone(radius, height, color):
    m = trimesh.creation.cone(radius=radius, height=height, sections=14)
    m.visual.face_colors = np.tile(rgba(color), (len(m.faces), 1))
    return m


def cyl(radius, height, color, sections=16):
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    m.visual.face_colors = np.tile(rgba(color), (len(m.faces), 1))
    return m


def save(name, meshes):
    scene_mesh = trimesh.util.concatenate(meshes)
    b = scene_mesh.bounds
    scene_mesh.apply_translation([0, -b[0][1], 0])
    (OUT / name).write_bytes(trimesh.exchange.gltf.export_glb(scene_mesh))


def windows(meshes, w, h, d, rows, cols, tint="#88b6d8", frame="#1e2630"):
    zw = d / 2 + 0.025
    pw = w / (cols + 2.5)
    ph = h / (rows + 3.0)
    for r in range(rows):
        for c in range(cols):
            x = -w / 2 + (c + 1.2) * (w / (cols + 1.4))
            y = h * 0.2 + (r + 0.9) * (h / (rows + 2.4))
            meshes.append(cbox([pw, ph, 0.05], [x, y, zw], frame))
            meshes.append(cbox([pw * 0.82, ph * 0.82, 0.06], [x, y, zw + 0.01], tint))


def build_building(filename, *, w, h, d, wall, roof, accent, rows=3, cols=5, tower=False, awning=False, columns=False, wings=False):
    parts = []
    parts.append(cbox([w, h, d], [0, h / 2, 0], wall))
    parts.append(cbox([w * 1.04, 0.08, d * 1.04], [0, h + 0.04, 0], roof))
    windows(parts, w * 0.9, h, d, rows, cols)
    parts.append(cbox([w * 0.17, h * 0.36, 0.06], [0, h * 0.18, d / 2 + 0.04], "#3b2c24"))
    parts.append(cbox([w * 0.24, 0.06, 0.08], [0, h * 0.38, d / 2 + 0.05], accent))

    if awning:
        parts.append(cbox([w * 0.62, 0.06, 0.32], [0, h * 0.5, d / 2 + 0.16], accent))
        parts.append(cbox([w * 0.58, 0.03, 0.28], [0, h * 0.47, d / 2 + 0.17], "#e7d5b5"))
    if columns:
        for i in range(4):
            x = -w * 0.23 + i * w * 0.15
            parts.append(cbox([0.1, h * 0.58, 0.1], [x, h * 0.29, d / 2 + 0.11], "#d8d3c3"))
        parts.append(cbox([w * 0.62, 0.1, 0.32], [0, h * 0.61, d / 2 + 0.11], roof))
    if tower:
        tw, th, td = w * 0.26, h * 0.78, d * 0.24
        parts.append(cbox([tw, th, td], [0, h + th / 2, -d * 0.15], accent))
        parts.append(cbox([tw * 1.06, 0.08, td * 1.06], [0, h + th + 0.04, -d * 0.15], roof))
    if wings:
        ww, wh, wd = w * 0.28, h * 0.68, d * 0.85
        parts.append(cbox([ww, wh, wd], [-w * 0.4, wh / 2, 0], wall))
        parts.append(cbox([ww, wh, wd], [w * 0.4, wh / 2, 0], wall))
        parts.append(cbox([ww * 1.03, 0.06, wd * 1.03], [-w * 0.4, wh + 0.03, 0], roof))
        parts.append(cbox([ww * 1.03, 0.06, wd * 1.03], [w * 0.4, wh + 0.03, 0], roof))

    for ox, oz in [(-w * 0.18, -d * 0.14), (w * 0.15, -d * 0.1), (0, d * 0.18)]:
        parts.append(cbox([w * 0.14, 0.15, d * 0.12], [ox, h + 0.08, oz], "#767d86"))
        parts.append(cbox([w * 0.08, 0.08, d * 0.08], [ox, h + 0.2, oz], "#b7bcc3"))

    save(filename, parts)


def build_tree_round(name="tree-round.glb"):
    parts = [cyl(0.08, 0.6, "#6a4d33", 12)]
    parts[0].apply_translation([0, 0.3, 0])
    canopy = trimesh.creation.icosphere(subdivisions=2, radius=0.34)
    canopy.visual.face_colors = np.tile(rgba("#3c8a48"), (len(canopy.faces), 1))
    canopy.apply_translation([0, 0.78, 0])
    parts.append(canopy)
    save(name, parts)


def build_tree_pine(name="tree-pine.glb"):
    parts = [cyl(0.07, 0.62, "#6a4d33", 10)]
    parts[0].apply_translation([0, 0.31, 0])
    c1 = cone(0.32, 0.55, "#2f7a3f"); c1.apply_translation([0, 0.75, 0]); parts.append(c1)
    c2 = cone(0.24, 0.42, "#358848"); c2.apply_translation([0, 1.02, 0]); parts.append(c2)
    save(name, parts)


def build_tree_bush(name="tree-bush.glb"):
    s = trimesh.creation.icosphere(subdivisions=1, radius=0.26)
    s.visual.face_colors = np.tile(rgba("#3f8b4c"), (len(s.faces), 1))
    s.apply_translation([0, 0.26, 0])
    save(name, [s])


def build_street_lamp(name="street-lamp.glb"):
    parts = []
    pole = cyl(0.035, 1.45, "#505862", 12); pole.apply_translation([0, 0.72, 0]); parts.append(pole)
    arm = cbox([0.28, 0.03, 0.03], [0.12, 1.35, 0], "#4a515b"); parts.append(arm)
    lamp = cbox([0.1, 0.1, 0.1], [0.26, 1.29, 0], "#f1e4b5"); parts.append(lamp)
    base = cbox([0.18, 0.04, 0.18], [0, 0.02, 0], "#3f454d"); parts.append(base)
    save(name, parts)


def build_bench(name="bench.glb"):
    parts = []
    parts.append(cbox([0.68, 0.05, 0.2], [0, 0.34, 0], "#8b623f"))
    parts.append(cbox([0.68, 0.05, 0.06], [0, 0.56, -0.07], "#8b623f"))
    for x in (-0.26, 0.26):
        parts.append(cbox([0.05, 0.34, 0.05], [x, 0.17, 0.07], "#4d5158"))
        parts.append(cbox([0.05, 0.34, 0.05], [x, 0.17, -0.07], "#4d5158"))
    save(name, parts)


def build_mailbox(name="mailbox.glb"):
    parts = [cbox([0.2, 0.42, 0.18], [0, 0.21, 0], "#2f76c2"), cbox([0.24, 0.06, 0.2], [0, 0.45, 0], "#d4dde8")]
    save(name, parts)


def build_simple_prop(name, color_a, color_b):
    parts = [
        cbox([0.34, 0.22, 0.34], [0, 0.11, 0], color_a),
        cbox([0.2, 0.16, 0.2], [0, 0.3, 0], color_b),
    ]
    save(name, parts)


def build_vehicle(name, body, roof):
    parts = [cbox([0.9, 0.28, 0.44], [0, 0.2, 0], body), cbox([0.46, 0.2, 0.4], [0, 0.43, 0], roof)]
    for x in (-0.32, 0.32):
        for z in (-0.2, 0.2):
            w = cyl(0.09, 0.08, "#1e2023", 14)
            w.apply_translation([x, 0.09, z])
            w.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
            parts.append(w)
    save(name, parts)


def build_character(name, shirt, pants, skin, hair, accent, taller=False):
    s = 1.12 if taller else 1.0
    parts = [
        cbox([0.14, 0.52 * s, 0.14], [-0.1, 0.26 * s, 0], pants),
        cbox([0.14, 0.52 * s, 0.14], [0.1, 0.26 * s, 0], pants),
        cbox([0.4, 0.18 * s, 0.22], [0, 0.62 * s, 0], pants),
        cbox([0.46, 0.5 * s, 0.24], [0, 0.96 * s, 0], shirt),
        cbox([0.12, 0.42 * s, 0.12], [-0.3, 0.98 * s, 0], skin),
        cbox([0.12, 0.42 * s, 0.12], [0.3, 0.98 * s, 0], skin),
        cbox([0.3, 0.32 * s, 0.28], [0, 1.42 * s, 0], skin),
        cbox([0.32, 0.1 * s, 0.3], [0, 1.58 * s, -0.01], hair),
        cbox([0.12, 0.08 * s, 0.08], [0, 1.42 * s, 0.15], accent),
        cbox([0.17, 0.08 * s, 0.22], [-0.1, 0.04 * s, 0.03], "#1f2124"),
        cbox([0.17, 0.08 * s, 0.22], [0.1, 0.04 * s, 0.03], "#1f2124"),
    ]
    save(name, parts)


def main():
    building_cfg = {
        "mine_hq.glb": dict(w=1.55, h=0.95, d=1.25, wall="#55667a", roof="#2f3a46", accent="#f19a33", rows=3, cols=5, wings=True, tower=True),
        "hardware_shop.glb": dict(w=1.35, h=0.82, d=1.05, wall="#586f86", roof="#2f3a46", accent="#4f9de6", rows=2, cols=5, awning=True),
        "exchange.glb": dict(w=1.3, h=0.86, d=1.0, wall="#6f7e89", roof="#2d3946", accent="#2fbe84", rows=3, cols=6),
        "bank.glb": dict(w=1.55, h=1.05, d=1.2, wall="#c7bda7", roof="#9b927d", accent="#c9a545", rows=3, cols=5, columns=True, tower=True),
        "diner.glb": dict(w=1.28, h=0.68, d=0.95, wall="#9a4c43", roof="#5a2727", accent="#e56155", rows=1, cols=5, awning=True),
        "coffee_shop.glb": dict(w=1.12, h=0.68, d=0.9, wall="#8e7a63", roof="#4d4034", accent="#cc9a62", rows=1, cols=4, awning=True),
        "university.glb": dict(w=1.58, h=0.96, d=1.28, wall="#8d7c93", roof="#5c4b66", accent="#d7d2cc", rows=3, cols=5, tower=True, wings=True),
        "hospital.glb": dict(w=1.42, h=0.92, d=1.1, wall="#d4d8df", roof="#6f7a88", accent="#cf3f46", rows=3, cols=6),
        "internet_cafe.glb": dict(w=1.25, h=0.74, d=0.96, wall="#365561", roof="#1b2e37", accent="#2fd9d4", rows=2, cols=5),
        "casino.glb": dict(w=1.6, h=0.9, d=1.22, wall="#7a3447", roof="#4a1f2f", accent="#f2b53f", rows=2, cols=6, awning=True),
        "post_office.glb": dict(w=1.35, h=0.8, d=1.0, wall="#8e97a6", roof="#505865", accent="#3f6cb3", rows=2, cols=4, columns=True),
        "gym.glb": dict(w=1.26, h=0.74, d=0.96, wall="#626a74", roof="#3f464f", accent="#e7843e", rows=2, cols=6),
        "real_estate_office.glb": dict(w=1.28, h=0.72, d=0.95, wall="#7d8c7b", roof="#4e5b4d", accent="#4aa865", rows=2, cols=4, awning=True),
        "pet_shop.glb": dict(w=1.18, h=0.7, d=0.9, wall="#b48b84", roof="#6a4d48", accent="#ff8aa6", rows=2, cols=4, awning=True),
        "pawn_shop.glb": dict(w=1.15, h=0.72, d=0.9, wall="#6d5f4a", roof="#43392c", accent="#d6aa3d", rows=1, cols=3),
        "bitcoin_atm.glb": dict(w=1.05, h=0.78, d=0.84, wall="#5e6874", roof="#333b46", accent="#f6a623", rows=2, cols=3),
        "clothing_store.glb": dict(w=1.3, h=0.75, d=0.95, wall="#8f6f7a", roof="#5a4550", accent="#e89bb4", rows=2, cols=5, awning=True),
        "apartment_building.glb": dict(w=1.18, h=1.15, d=0.98, wall="#83786e", roof="#58504b", accent="#c9a783", rows=5, cols=4),
        "furniture_store.glb": dict(w=1.35, h=0.8, d=1.02, wall="#788267", roof="#4d5642", accent="#a0bf68", rows=2, cols=5, awning=True),
        "building-garage.glb": dict(w=1.2, h=0.62, d=0.95, wall="#777d86", roof="#4b5159", accent="#a6b1bf", rows=1, cols=2),
        "building-small-a.glb": dict(w=1.0, h=0.7, d=0.8, wall="#807a70", roof="#5f5348", accent="#bda17c", rows=2, cols=3),
        "building-small-b.glb": dict(w=1.05, h=0.74, d=0.86, wall="#7a6f80", roof="#4d4453", accent="#b08ac6", rows=2, cols=3),
        "building-small-c.glb": dict(w=1.1, h=0.72, d=0.84, wall="#6a7a83", roof="#46545d", accent="#8fb8ce", rows=2, cols=4),
        "building-small-d.glb": dict(w=1.0, h=0.69, d=0.82, wall="#837264", roof="#5e4e43", accent="#c69a71", rows=2, cols=3),
    }
    for file, cfg in building_cfg.items():
        build_building(file, **cfg)
        print("generated", file)

    build_tree_round("grass-trees.glb"); print("generated grass-trees.glb")
    build_tree_pine("grass-trees-tall.glb"); print("generated grass-trees-tall.glb")
    build_street_lamp("street_lamp.glb"); print("generated street_lamp.glb")
    build_bench("park_bench.glb"); print("generated park_bench.glb")
    build_mailbox("mailbox.glb"); print("generated mailbox.glb")
    build_simple_prop("fire_hydrant.glb", "#c73833", "#b42420"); print("generated fire_hydrant.glb")
    build_simple_prop("trash_can.glb", "#4f5a63", "#6c7b86"); print("generated trash_can.glb")
    build_simple_prop("bus_stop.glb", "#4d6a86", "#adc6dd"); print("generated bus_stop.glb")
    build_simple_prop("flower_planter.glb", "#8b5e3f", "#58a35f"); print("generated flower_planter.glb")
    build_simple_prop("garden_center.glb", "#6f7442", "#8ca45a"); print("generated garden_center.glb")
    build_character("avatar_player.glb", "#f1a33d", "#2e3b48", "#d6ac84", "#4a3a2d", "#ffcf57", taller=False); print("generated avatar_player.glb")
    build_character("npc_craig.glb", "#7a2e37", "#2c2f38", "#c89d79", "#2f2520", "#d84c54", taller=True); print("generated npc_craig.glb")


if __name__ == "__main__":
    main()

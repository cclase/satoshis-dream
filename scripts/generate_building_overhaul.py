import math
from pathlib import Path

import numpy as np
import trimesh
from trimesh import transformations as tf


ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"
MODELS.mkdir(parents=True, exist_ok=True)


def rgba(hex_color: str, alpha: int = 255) -> np.ndarray:
    h = hex_color.strip().lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha], dtype=np.uint8)


def tint(hex_color: str, delta: int) -> str:
    h = hex_color.strip().lstrip("#")
    r = max(0, min(255, int(h[0:2], 16) + delta))
    g = max(0, min(255, int(h[2:4], 16) + delta))
    b = max(0, min(255, int(h[4:6], 16) + delta))
    return f"#{r:02x}{g:02x}{b:02x}"


def paint(mesh: trimesh.Trimesh, color_hex: str) -> trimesh.Trimesh:
    mesh.visual.face_colors = np.tile(rgba(color_hex), (len(mesh.faces), 1))
    return mesh


def box(extents, center, color_hex: str) -> trimesh.Trimesh:
    m = trimesh.creation.box(extents=extents)
    m.apply_translation(center)
    return paint(m, color_hex)


def cylinder(radius: float, height: float, center, color_hex: str, sections: int = 20) -> trimesh.Trimesh:
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    m.apply_translation(center)
    return paint(m, color_hex)


def cone(radius: float, height: float, center, color_hex: str, sections: int = 20) -> trimesh.Trimesh:
    m = trimesh.creation.cone(radius=radius, height=height, sections=sections)
    m.apply_translation(center)
    return paint(m, color_hex)


def sphere(radius: float, center, color_hex: str, subdivisions: int = 2) -> trimesh.Trimesh:
    m = trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius)
    m.apply_translation(center)
    return paint(m, color_hex)


def limb(radius: float, length: float, center, color_hex: str) -> trimesh.Trimesh:
    shaft = cylinder(radius, length, center, color_hex, sections=16)
    cap_a = sphere(radius, [center[0], center[1] + length / 2, center[2]], color_hex, subdivisions=1)
    cap_b = sphere(radius, [center[0], center[1] - length / 2, center[2]], color_hex, subdivisions=1)
    return trimesh.util.concatenate([shaft, cap_a, cap_b])


def rotate(mesh: trimesh.Trimesh, axis, radians: float) -> trimesh.Trimesh:
    mesh.apply_transform(tf.rotation_matrix(radians, axis))
    return mesh


def gable_roof(width: float, depth: float, rise: float, center, color_hex: str) -> trimesh.Trimesh:
    w = width / 2
    d = depth / 2
    r = rise
    vertices = np.array(
        [
            [-w, 0, -d],
            [w, 0, -d],
            [0, r, -d],
            [-w, 0, d],
            [w, 0, d],
            [0, r, d],
        ],
        dtype=float,
    )
    faces = np.array(
        [
            [0, 1, 2],
            [3, 5, 4],
            [0, 2, 5],
            [0, 5, 3],
            [1, 4, 5],
            [1, 5, 2],
            [0, 3, 4],
            [0, 4, 1],
        ],
        dtype=int,
    )
    m = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    m.apply_translation(center)
    return paint(m, color_hex)


def steps(parts: list, width: float, depth: float, step_h: float, count: int, front_z: float, color_hex: str):
    for i in range(count):
        w = width * (1 - i * 0.08)
        d = depth * (1 - i * 0.08)
        y = step_h * (i + 0.5)
        z = front_z + i * (depth * 0.12)
        parts.append(box([w, step_h, d], [0, y, z], color_hex))


def add_window_grid(parts: list, width: float, height: float, depth: float, y0: float, rows: int, cols: int, glass: str):
    frame = "#1e2730"
    zw = depth / 2 + 0.03
    pane_w = width / (cols + 2.0)
    pane_h = height / (rows + 2.2)
    for r in range(rows):
        for c in range(cols):
            x = -width / 2 + (c + 1.1) * (width / (cols + 1.2))
            y = y0 + (r + 0.8) * (height / (rows + 1.3))
            parts.append(box([pane_w * 1.03, pane_h * 1.03, 0.05], [x, y, zw], frame))
            parts.append(box([pane_w * 0.82, pane_h * 0.82, 0.06], [x, y, zw + 0.01], glass))


def add_parapet(parts: list, width: float, depth: float, y: float, color_hex: str):
    t = 0.06
    parts.append(box([width, t, t], [0, y, depth / 2], color_hex))
    parts.append(box([width, t, t], [0, y, -depth / 2], color_hex))
    parts.append(box([t, t, depth], [width / 2, y, 0], color_hex))
    parts.append(box([t, t, depth], [-width / 2, y, 0], color_hex))


def add_roof_units(parts: list, width: float, depth: float, y: float):
    pads = [(-0.22, -0.18), (0.24, -0.1), (0.0, 0.22)]
    for ox, oz in pads:
        x = ox * width
        z = oz * depth
        parts.append(box([width * 0.18, 0.14, depth * 0.14], [x, y + 0.07, z], "#6f7680"))
        parts.append(box([width * 0.08, 0.08, depth * 0.08], [x, y + 0.17, z], "#b9c0c9"))


def export_mesh(name: str, meshes: list):
    merged = trimesh.util.concatenate(meshes)
    bounds = merged.bounds
    merged.apply_translation([0, -bounds[0][1], 0])
    (MODELS / name).write_bytes(trimesh.exchange.gltf.export_glb(merged))


def build_mine_hq() -> list:
    p = []
    p.append(box([1.7, 0.22, 1.35], [0.05, 0.11, 0.02], "#51453a"))
    p.append(box([1.3, 0.72, 1.0], [-0.08, 0.58, 0.0], "#4f5f70"))
    p.append(box([0.92, 0.52, 0.7], [0.2, 1.08, -0.08], "#40515f"))
    p.append(box([0.56, 0.34, 0.44], [0.25, 1.46, -0.15], "#344552"))
    p.append(cylinder(0.14, 1.2, [-0.58, 0.6, 0.35], "#788692"))
    p.append(cylinder(0.14, 1.2, [-0.32, 0.6, 0.35], "#788692"))
    conveyor = box([0.92, 0.08, 0.16], [0.05, 0.9, 0.35], "#9e6d35")
    rotate(conveyor, [0, 0, 1], math.radians(-18))
    p.append(conveyor)
    add_window_grid(p, 1.2, 0.55, 1.0, 0.28, 2, 5, "#7fa6c2")
    add_roof_units(p, 1.3, 1.0, 1.7)
    return p


def build_hardware_shop() -> list:
    p = []
    p.append(box([1.42, 0.18, 1.1], [0, 0.09, 0], "#666b72"))
    p.append(box([1.15, 0.62, 0.88], [0, 0.49, 0.02], "#607287"))
    p.append(box([0.48, 0.52, 0.54], [0.58, 0.44, -0.08], "#536377"))
    p.append(gable_roof(1.22, 0.92, 0.28, [0, 0.84, 0.02], "#354352"))
    p.append(gable_roof(0.54, 0.58, 0.2, [0.58, 0.71, -0.08], "#354352"))
    add_window_grid(p, 1.04, 0.42, 0.88, 0.24, 1, 5, "#82add3")
    p.append(box([0.26, 0.34, 0.08], [-0.42, 0.17, 0.49], "#2f2a25"))
    p.append(box([0.72, 0.06, 0.3], [0.05, 0.44, 0.61], "#4f9de6"))
    return p


def build_exchange() -> list:
    p = []
    p.append(box([1.2, 0.14, 0.96], [0, 0.07, 0], "#657078"))
    p.append(box([0.92, 0.9, 0.78], [0, 0.52, 0], "#71808a"))
    p.append(box([0.56, 0.74, 0.46], [0.08, 1.28, -0.04], "#61717c"))
    p.append(cylinder(0.16, 0.88, [-0.32, 1.08, -0.12], "#54646f"))
    p.append(cylinder(0.1, 0.62, [0.34, 1.45, 0.05], "#4b5965"))
    add_window_grid(p, 0.86, 0.8, 0.78, 0.2, 4, 5, "#89bfdc")
    p.append(box([0.68, 0.06, 0.24], [0.0, 0.55, 0.5], "#2fbf84"))
    add_roof_units(p, 0.92, 0.78, 1.85)
    return p


def build_bank() -> list:
    p = []
    p.append(box([1.62, 0.2, 1.28], [0, 0.1, 0], "#9b917f"))
    steps(p, width=1.05, depth=0.5, step_h=0.05, count=4, front_z=0.5, color_hex="#b5ab97")
    p.append(box([1.22, 0.7, 0.9], [0, 0.55, -0.05], "#cdbfa6"))
    for i in range(5):
        x = -0.46 + i * 0.23
        p.append(cylinder(0.05, 0.52, [x, 0.36, 0.44], "#ddd6c5"))
    p.append(box([0.88, 0.08, 0.28], [0, 0.67, 0.45], "#b9ad95"))
    p.append(gable_roof(0.95, 0.28, 0.22, [0, 0.71, 0.45], "#a3957a"))
    p.append(box([0.44, 0.88, 0.32], [0, 1.14, -0.28], "#d3c5ad"))
    p.append(gable_roof(0.5, 0.36, 0.2, [0, 1.58, -0.28], "#a3957a"))
    add_window_grid(p, 1.0, 0.52, 0.9, 0.26, 2, 5, "#93b3c8")
    return p


def build_diner() -> list:
    p = []
    p.append(box([1.28, 0.14, 1.0], [0, 0.07, 0], "#7f5149"))
    p.append(box([1.08, 0.56, 0.82], [0, 0.4, 0], "#8d473f"))
    p.append(cylinder(0.16, 0.56, [-0.54, 0.4, 0.0], "#8d473f"))
    p.append(cylinder(0.16, 0.56, [0.54, 0.4, 0.0], "#8d473f"))
    p.append(box([1.08, 0.08, 0.88], [0, 0.72, 0], "#5a2b2b"))
    p.append(box([0.92, 0.06, 0.34], [0, 0.46, 0.56], "#e26155"))
    add_window_grid(p, 0.96, 0.32, 0.82, 0.2, 1, 6, "#a0d4eb")
    p.append(box([0.2, 0.3, 0.07], [0, 0.16, 0.5], "#2b2725"))
    return p


def build_coffee_shop() -> list:
    p = []
    p.append(box([1.12, 0.14, 0.94], [0, 0.07, 0], "#6b5646"))
    p.append(box([0.96, 0.48, 0.78], [0, 0.34, 0], "#846d5a"))
    p.append(gable_roof(1.02, 0.82, 0.3, [0, 0.58, 0], "#43362d"))
    p.append(box([0.58, 0.06, 0.26], [0, 0.34, 0.52], "#c59a66"))
    add_window_grid(p, 0.9, 0.3, 0.78, 0.16, 1, 4, "#95c5dd")
    p.append(box([0.18, 0.28, 0.07], [-0.24, 0.15, 0.46], "#2e2823"))
    p.append(box([0.08, 0.38, 0.08], [0.3, 0.75, -0.2], "#6b6055"))
    return p


def build_university() -> list:
    p = []
    p.append(box([1.68, 0.18, 1.36], [0, 0.09, 0], "#827b8a"))
    p.append(box([1.18, 0.72, 0.92], [0, 0.54, 0], "#93879a"))
    p.append(box([0.44, 0.62, 0.82], [-0.6, 0.47, 0.02], "#8b7f94"))
    p.append(box([0.44, 0.62, 0.82], [0.6, 0.47, 0.02], "#8b7f94"))
    p.append(box([0.34, 1.04, 0.34], [0, 1.03, -0.24], "#7f7387"))
    p.append(gable_roof(0.42, 0.4, 0.22, [0, 1.56, -0.24], "#5c4d68"))
    add_window_grid(p, 1.06, 0.58, 0.92, 0.24, 3, 5, "#8fb0cf")
    add_window_grid(p, 0.38, 0.86, 0.34, 0.36, 4, 2, "#9bc2dd")
    p.append(box([0.72, 0.08, 0.26], [0, 0.49, 0.58], "#d5d0c9"))
    return p


def build_hospital() -> list:
    p = []
    p.append(box([1.5, 0.16, 1.2], [0, 0.08, 0], "#a6adb8"))
    p.append(box([1.04, 0.7, 0.78], [0, 0.51, 0], "#d2d8df"))
    p.append(box([0.34, 0.66, 1.02], [-0.38, 0.49, 0.0], "#c7ced7"))
    p.append(box([0.34, 0.66, 1.02], [0.38, 0.49, 0.0], "#c7ced7"))
    p.append(box([0.22, 0.58, 0.22], [0, 0.95, -0.16], "#d9dee5"))
    p.append(box([0.12, 0.44, 0.08], [0, 1.28, -0.16], "#d4474e"))
    p.append(box([0.36, 0.12, 0.08], [0, 1.28, -0.16], "#d4474e"))
    pad = cylinder(0.2, 0.04, [0, 0.9, 0.22], "#adb4be", sections=28)
    p.append(pad)
    p.append(box([0.3, 0.02, 0.02], [0, 0.93, 0.22], "#f2f4f6"))
    p.append(box([0.02, 0.02, 0.3], [0, 0.93, 0.22], "#f2f4f6"))
    add_window_grid(p, 1.0, 0.52, 0.78, 0.24, 3, 6, "#9cc6dd")
    return p


def build_internet_cafe() -> list:
    p = []
    p.append(box([1.2, 0.14, 0.96], [0, 0.07, 0], "#3f5b64"))
    p.append(box([1.0, 0.58, 0.78], [0, 0.41, 0], "#32505a"))
    roof = box([1.02, 0.12, 0.82], [0.02, 0.78, -0.04], "#1f3139")
    rotate(roof, [1, 0, 0], math.radians(-10))
    p.append(roof)
    p.append(box([0.72, 0.32, 0.08], [0, 0.27, 0.44], "#89c7e1"))
    p.append(box([0.76, 0.06, 0.24], [0, 0.54, 0.5], "#2fd8d4"))
    add_window_grid(p, 0.92, 0.36, 0.78, 0.18, 2, 5, "#7fc2e2")
    p.append(cylinder(0.06, 0.4, [-0.34, 0.78, -0.18], "#768791"))
    p.append(sphere(0.08, [-0.34, 1.02, -0.18], "#3ad0d1", subdivisions=2))
    return p


def build_casino() -> list:
    p = []
    p.append(box([1.64, 0.18, 1.3], [0, 0.09, 0], "#58263a"))
    p.append(box([1.22, 0.68, 1.0], [0, 0.5, 0], "#6e2f44"))
    p.append(cylinder(0.24, 0.88, [-0.46, 0.62, 0.0], "#522338"))
    p.append(cylinder(0.24, 0.88, [0.46, 0.62, 0.0], "#522338"))
    p.append(box([0.82, 0.08, 0.34], [0, 0.46, 0.64], "#e0a73f"))
    p.append(box([1.04, 0.08, 0.2], [0, 0.74, 0.52], "#8e2bb0"))
    add_window_grid(p, 1.1, 0.46, 1.0, 0.22, 2, 6, "#8eb8d4")
    add_roof_units(p, 1.22, 1.0, 1.02)
    return p


def build_post_office() -> list:
    p = []
    p.append(box([1.36, 0.16, 1.04], [0, 0.08, 0], "#7f8794"))
    steps(p, width=0.82, depth=0.36, step_h=0.04, count=3, front_z=0.44, color_hex="#9ea6b3")
    p.append(box([1.02, 0.56, 0.82], [0, 0.4, -0.03], "#939cab"))
    for i in range(4):
        x = -0.32 + i * 0.21
        p.append(cylinder(0.045, 0.42, [x, 0.25, 0.39], "#d4d8df"))
    p.append(box([0.7, 0.08, 0.24], [0, 0.49, 0.39], "#4b6cb2"))
    p.append(gable_roof(0.74, 0.24, 0.16, [0, 0.53, 0.39], "#606a79"))
    add_window_grid(p, 0.9, 0.4, 0.82, 0.2, 2, 4, "#8ab5d8")
    return p


def build_gym() -> list:
    p = []
    p.append(box([1.24, 0.14, 0.98], [0, 0.07, 0], "#565f69"))
    p.append(box([1.08, 0.6, 0.82], [0, 0.37, 0], "#5f6873"))
    for i in range(3):
        x = -0.32 + i * 0.32
        tooth = gable_roof(0.28, 0.82, 0.14, [x, 0.66, 0], "#3f4751")
        rotate(tooth, [0, 0, 1], math.radians(-90))
        p.append(tooth)
    p.append(box([0.76, 0.06, 0.24], [0, 0.46, 0.52], "#e8843f"))
    add_window_grid(p, 0.98, 0.34, 0.82, 0.18, 1, 6, "#8eb8d6")
    return p


def build_real_estate() -> list:
    p = []
    p.append(box([1.2, 0.14, 0.94], [0, 0.07, 0], "#7f8f80"))
    p.append(box([0.98, 0.5, 0.78], [0, 0.35, 0], "#95a494"))
    p.append(gable_roof(1.04, 0.82, 0.24, [0, 0.62, 0], "#4e5e4f"))
    p.append(box([0.58, 0.05, 0.24], [0, 0.34, 0.5], "#4aa865"))
    p.append(box([0.22, 0.3, 0.07], [0.22, 0.15, 0.44], "#322a25"))
    add_window_grid(p, 0.9, 0.3, 0.78, 0.18, 1, 4, "#98c1db")
    return p


def build_pet_shop() -> list:
    p = []
    p.append(box([1.1, 0.14, 0.9], [0, 0.07, 0], "#9e7f79"))
    p.append(box([0.9, 0.46, 0.7], [0, 0.32, 0], "#b48b84"))
    p.append(gable_roof(0.96, 0.74, 0.24, [0, 0.56, 0], "#6a4d48"))
    p.append(box([0.62, 0.05, 0.22], [0, 0.32, 0.46], "#ff8ba7"))
    p.append(cylinder(0.11, 0.26, [-0.28, 0.2, 0.34], "#c69991"))
    p.append(cylinder(0.11, 0.26, [0.28, 0.2, 0.34], "#c69991"))
    add_window_grid(p, 0.82, 0.28, 0.7, 0.16, 1, 3, "#9ac8e2")
    return p


def build_pawn_shop() -> list:
    p = []
    p.append(box([1.08, 0.14, 0.9], [0, 0.07, 0], "#675944"))
    p.append(box([0.9, 0.54, 0.72], [0, 0.38, 0], "#75654d"))
    add_parapet(p, 0.92, 0.74, 0.68, "#433a2d")
    p.append(box([0.54, 0.05, 0.2], [0, 0.36, 0.45], "#d7ab3c"))
    add_window_grid(p, 0.76, 0.28, 0.72, 0.16, 1, 3, "#8ab4cf")
    p.append(box([0.2, 0.3, 0.07], [0, 0.15, 0.41], "#2d2824"))
    return p


def build_bitcoin_atm() -> list:
    p = []
    p.append(box([0.92, 0.14, 0.78], [0, 0.07, 0], "#5f6975"))
    p.append(box([0.68, 0.5, 0.52], [0, 0.32, 0], "#6d7885"))
    roof = box([0.74, 0.1, 0.56], [0, 0.62, 0.0], "#333c47")
    rotate(roof, [1, 0, 0], math.radians(-7))
    p.append(roof)
    p.append(box([0.22, 0.34, 0.18], [0, 0.24, 0.2], "#f6a623"))
    p.append(box([0.16, 0.14, 0.06], [0, 0.29, 0.31], "#1f2630"))
    p.append(cylinder(0.05, 0.24, [0.26, 0.64, -0.16], "#6f7d89"))
    p.append(sphere(0.07, [0.26, 0.78, -0.16], "#f6a623", subdivisions=2))
    return p


def build_clothing_store() -> list:
    p = []
    p.append(box([1.28, 0.14, 0.98], [0, 0.07, 0], "#7f6571"))
    p.append(box([1.06, 0.52, 0.8], [0, 0.36, 0], "#936f7d"))
    p.append(gable_roof(1.12, 0.84, 0.24, [0, 0.62, 0], "#5b4652"))
    p.append(box([0.7, 0.06, 0.26], [0, 0.4, 0.54], "#e89cb6"))
    for i in range(5):
        x = -0.42 + i * 0.21
        p.append(box([0.03, 0.34, 0.08], [x, 0.31, 0.42], "#d7b6c0"))
    add_window_grid(p, 0.94, 0.3, 0.8, 0.18, 1, 5, "#9fc8dd")
    return p


def build_apartment() -> list:
    p = []
    p.append(box([1.2, 0.16, 1.0], [0, 0.08, 0], "#75695f"))
    p.append(box([0.94, 1.26, 0.72], [0, 0.79, -0.06], "#8b7d70"))
    p.append(box([0.52, 0.92, 0.4], [0.22, 1.17, 0.2], "#7c6f62"))
    add_window_grid(p, 0.86, 1.0, 0.72, 0.24, 5, 4, "#9cbfd5")
    for level in range(4):
        y = 0.36 + level * 0.24
        p.append(box([0.86, 0.03, 0.08], [0, y, 0.34], "#5c534b"))
    p.append(box([0.22, 0.36, 0.07], [-0.22, 0.18, 0.34], "#2d2824"))
    p.append(additional_tank())
    return p


def additional_tank() -> trimesh.Trimesh:
    tank = cylinder(0.1, 0.22, [0.28, 1.54, -0.2], "#b5b0a7")
    return tank


def build_furniture_store() -> list:
    p = []
    p.append(box([1.34, 0.16, 1.04], [0, 0.08, 0], "#6e765f"))
    p.append(box([1.1, 0.62, 0.86], [0, 0.47, 0], "#7f8a6e"))
    p.append(box([0.6, 0.46, 0.42], [-0.34, 0.4, 0.26], "#737d63"))
    p.append(box([0.64, 0.06, 0.26], [0, 0.46, 0.56], "#a1bf68"))
    for i in range(3):
        x = -0.3 + i * 0.3
        p.append(gable_roof(0.24, 0.86, 0.14, [x, 0.79, 0], "#4d5642"))
    add_window_grid(p, 0.98, 0.34, 0.86, 0.2, 1, 5, "#94bdd8")
    return p


def build_garage() -> list:
    p = []
    p.append(box([1.08, 0.14, 0.88], [0, 0.07, 0], "#6f747a"))
    p.append(box([0.9, 0.44, 0.7], [0, 0.29, 0], "#7b828b"))
    p.append(gable_roof(0.94, 0.74, 0.18, [0, 0.52, 0], "#4b5057"))
    p.append(box([0.46, 0.28, 0.07], [0, 0.16, 0.36], "#353a42"))
    p.append(box([0.52, 0.04, 0.08], [0, 0.34, 0.37], "#a3afbf"))
    return p


def build_small_a() -> list:
    p = build_garage()
    p.append(box([0.24, 0.18, 0.2], [0.26, 0.78, -0.1], "#8e7b69"))
    return p


def build_small_b() -> list:
    p = []
    p.append(box([1.0, 0.12, 0.82], [0, 0.06, 0], "#70657b"))
    p.append(box([0.82, 0.5, 0.66], [0, 0.31, 0], "#7c7088"))
    p.append(gable_roof(0.86, 0.7, 0.2, [0, 0.56, 0], "#4d4453"))
    add_window_grid(p, 0.74, 0.3, 0.66, 0.17, 1, 3, "#9dbddb")
    return p


def build_small_c() -> list:
    p = []
    p.append(box([1.06, 0.13, 0.84], [0, 0.065, 0], "#637682"))
    p.append(box([0.88, 0.52, 0.68], [0, 0.33, 0], "#6a7f8b"))
    p.append(box([0.48, 0.28, 0.32], [0.2, 0.73, -0.06], "#5e7380"))
    p.append(additional_tank())
    add_window_grid(p, 0.8, 0.32, 0.68, 0.18, 1, 4, "#9ec4de")
    return p


def build_small_d() -> list:
    p = []
    p.append(box([1.0, 0.12, 0.82], [0, 0.06, 0], "#7f6f62"))
    p.append(box([0.84, 0.48, 0.66], [0, 0.3, 0], "#8b7a6c"))
    p.append(gable_roof(0.88, 0.7, 0.2, [0, 0.54, 0], "#5f4f43"))
    add_window_grid(p, 0.76, 0.3, 0.66, 0.17, 1, 3, "#9fc0d8")
    return p


def build_tree_round() -> list:
    p = [cylinder(0.08, 0.62, [0, 0.31, 0], "#6b4e34")]
    p.append(sphere(0.26, [0, 0.66, 0], "#2f7f45", subdivisions=2))
    p.append(sphere(0.2, [-0.12, 0.72, 0.06], "#348a4a", subdivisions=1))
    p.append(sphere(0.2, [0.12, 0.74, -0.04], "#358d4d", subdivisions=1))
    return p


def build_tree_tall() -> list:
    p = [cylinder(0.07, 0.7, [0, 0.35, 0], "#6b4e34")]
    p.append(cone(0.26, 0.48, [0, 0.72, 0], "#2d7740", sections=16))
    p.append(cone(0.2, 0.38, [0, 0.98, 0], "#348649", sections=16))
    return p


def build_street_lamp() -> list:
    p = []
    pole = cylinder(0.03, 1.46, [0, 0.73, 0], "#505862", sections=14)
    p.append(pole)
    arm = box([0.28, 0.03, 0.03], [0.13, 1.35, 0], "#464d56")
    p.append(arm)
    p.append(box([0.1, 0.12, 0.1], [0.27, 1.28, 0], "#f4e7b6"))
    p.append(box([0.18, 0.04, 0.18], [0, 0.02, 0], "#3f454d"))
    return p


def build_bench() -> list:
    p = []
    p.append(box([0.72, 0.06, 0.22], [0, 0.34, 0], "#8a623f"))
    p.append(box([0.72, 0.06, 0.07], [0, 0.56, -0.07], "#8a623f"))
    for x in (-0.28, 0.28):
        p.append(box([0.05, 0.34, 0.05], [x, 0.17, 0.08], "#4d5158"))
        p.append(box([0.05, 0.34, 0.05], [x, 0.17, -0.08], "#4d5158"))
    return p


def build_mailbox() -> list:
    return [box([0.2, 0.42, 0.18], [0, 0.21, 0], "#2f76c2"), box([0.24, 0.06, 0.2], [0, 0.45, 0], "#d4dde8")]


def build_prop(color_a: str, color_b: str) -> list:
    return [box([0.34, 0.22, 0.34], [0, 0.11, 0], color_a), box([0.2, 0.16, 0.2], [0, 0.3, 0], color_b)]


def build_character(shirt: str, pants: str, skin: str, hair: str, accent: str, tall: bool) -> list:
    s = 1.14 if tall else 1.0
    p = []
    p.append(limb(0.055, 0.52 * s, [-0.11, 0.34 * s, 0], pants))
    p.append(limb(0.055, 0.52 * s, [0.11, 0.34 * s, 0], pants))
    p.append(box([0.32, 0.16 * s, 0.2], [0, 0.62 * s, 0], tint(pants, 8)))
    p.append(cylinder(0.18, 0.52 * s, [0, 0.95 * s, 0], shirt, sections=20))
    p.append(sphere(0.2, [0, 1.22 * s, 0], shirt, subdivisions=2))
    p.append(limb(0.045, 0.46 * s, [-0.25, 0.95 * s, 0], skin))
    p.append(limb(0.045, 0.46 * s, [0.25, 0.95 * s, 0], skin))
    p.append(cylinder(0.06, 0.06 * s, [0, 1.37 * s, 0], skin, sections=18))
    p.append(sphere(0.16, [0, 1.53 * s, 0], skin, subdivisions=3))
    p.append(sphere(0.17, [0, 1.58 * s, -0.02], hair, subdivisions=2))
    p.append(box([0.12, 0.03, 0.06], [0, 1.5 * s, 0.14], accent))
    p.append(box([0.18, 0.07, 0.26], [-0.11, 0.04 * s, 0.03], "#1f2124"))
    p.append(box([0.18, 0.07, 0.26], [0.11, 0.04 * s, 0.03], "#1f2124"))
    return p


def main():
    builders = {
        "mine_hq.glb": build_mine_hq,
        "hardware_shop.glb": build_hardware_shop,
        "exchange.glb": build_exchange,
        "bank.glb": build_bank,
        "diner.glb": build_diner,
        "coffee_shop.glb": build_coffee_shop,
        "university.glb": build_university,
        "hospital.glb": build_hospital,
        "internet_cafe.glb": build_internet_cafe,
        "casino.glb": build_casino,
        "post_office.glb": build_post_office,
        "gym.glb": build_gym,
        "real_estate_office.glb": build_real_estate,
        "pet_shop.glb": build_pet_shop,
        "pawn_shop.glb": build_pawn_shop,
        "bitcoin_atm.glb": build_bitcoin_atm,
        "clothing_store.glb": build_clothing_store,
        "apartment_building.glb": build_apartment,
        "furniture_store.glb": build_furniture_store,
        "building-garage.glb": build_garage,
        "building-small-a.glb": build_small_a,
        "building-small-b.glb": build_small_b,
        "building-small-c.glb": build_small_c,
        "building-small-d.glb": build_small_d,
    }

    for name, fn in builders.items():
        export_mesh(name, fn())
        print(f"generated: {name}")

    export_mesh("grass-trees.glb", build_tree_round())
    print("generated: grass-trees.glb")
    export_mesh("grass-trees-tall.glb", build_tree_tall())
    print("generated: grass-trees-tall.glb")
    export_mesh("street_lamp.glb", build_street_lamp())
    print("generated: street_lamp.glb")
    export_mesh("park_bench.glb", build_bench())
    print("generated: park_bench.glb")
    export_mesh("mailbox.glb", build_mailbox())
    print("generated: mailbox.glb")
    export_mesh("fire_hydrant.glb", build_prop("#c73833", "#b42420"))
    print("generated: fire_hydrant.glb")
    export_mesh("trash_can.glb", build_prop("#4f5a63", "#6c7b86"))
    print("generated: trash_can.glb")
    export_mesh("bus_stop.glb", build_prop("#4d6a86", "#adc6dd"))
    print("generated: bus_stop.glb")
    export_mesh("flower_planter.glb", build_prop("#8b5e3f", "#58a35f"))
    print("generated: flower_planter.glb")
    export_mesh("garden_center.glb", build_prop("#6f7442", "#8ca45a"))
    print("generated: garden_center.glb")

    export_mesh(
        "avatar_player.glb",
        build_character(
            shirt="#f2a742",
            pants="#334252",
            skin="#d7ad86",
            hair="#4a3a2d",
            accent="#ffd45c",
            tall=False,
        ),
    )
    print("generated: avatar_player.glb")

    export_mesh(
        "npc_craig.glb",
        build_character(
            shirt="#7a2f39",
            pants="#2c313a",
            skin="#cb9f7b",
            hair="#2f2520",
            accent="#d84c54",
            tall=True,
        ),
    )
    print("generated: npc_craig.glb")


if __name__ == "__main__":
    main()

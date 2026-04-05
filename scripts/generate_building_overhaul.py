from pathlib import Path
import math

import numpy as np
import trimesh
from trimesh import transformations as tf


ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"
MODELS.mkdir(parents=True, exist_ok=True)


def rgba(hex_color: str, a: int = 255):
    h = hex_color.strip().lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a], dtype=np.uint8)


def tint(hex_color: str, delta: int) -> str:
    h = hex_color.strip().lstrip("#")
    r = max(0, min(255, int(h[0:2], 16) + delta))
    g = max(0, min(255, int(h[2:4], 16) + delta))
    b = max(0, min(255, int(h[4:6], 16) + delta))
    return f"#{r:02x}{g:02x}{b:02x}"


def paint(mesh: trimesh.Trimesh, color_hex: str):
    mesh.visual.face_colors = np.tile(rgba(color_hex), (len(mesh.faces), 1))
    return mesh


def box(extents, center, color_hex: str):
    m = trimesh.creation.box(extents=extents)
    m.apply_translation(center)
    return paint(m, color_hex)


def cyl(radius: float, height: float, center, color_hex: str, sections: int = 18):
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    m.apply_translation(center)
    return paint(m, color_hex)


def cone(radius: float, height: float, center, color_hex: str, sections: int = 18):
    m = trimesh.creation.cone(radius=radius, height=height, sections=sections)
    m.apply_translation(center)
    return paint(m, color_hex)


def sphere(radius: float, center, color_hex: str, subdivisions: int = 2):
    m = trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius)
    m.apply_translation(center)
    return paint(m, color_hex)


def rotate(mesh: trimesh.Trimesh, axis, radians: float):
    mesh.apply_transform(tf.rotation_matrix(radians, axis))
    return mesh


def gable(width: float, depth: float, rise: float, center, color_hex: str):
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


def add_windows_front(parts: list, width: float, depth: float, floors: int, cols: int, y_bottom: float, floor_h: float, glass="#99c7e4"):
    z = depth / 2 + 0.03
    for r in range(floors):
        y = y_bottom + r * floor_h + floor_h * 0.52
        for c in range(cols):
            x = -width / 2 + (c + 0.8) * (width / (cols + 0.6))
            parts.append(box([width / (cols + 3.2), floor_h * 0.58, 0.06], [x, y, z], "#1e2730"))
            parts.append(box([width / (cols + 4.2), floor_h * 0.46, 0.07], [x, y, z + 0.01], glass))
            parts.append(box([width / (cols + 4.2), 0.02, 0.08], [x, y - floor_h * 0.32, z + 0.01], tint(glass, 12)))


def add_windows_sides(parts: list, depth: float, floors: int, cols: int, y_bottom: float, floor_h: float, side_x: float, glass="#8fbdd8"):
    x = side_x
    sign = 1 if x > 0 else -1
    for r in range(floors):
        y = y_bottom + r * floor_h + floor_h * 0.5
        for c in range(cols):
            z = -depth / 2 + (c + 0.8) * (depth / (cols + 0.6))
            parts.append(box([0.06, floor_h * 0.55, depth / (cols + 3.0)], [x, y, z], "#1e2730"))
            parts.append(box([0.07, floor_h * 0.44, depth / (cols + 4.0)], [x + sign * 0.01, y, z], glass))


def add_pilasters(parts: list, width: float, depth: float, height: float, color_hex: str):
    for x in (-width / 2 + 0.06, width / 2 - 0.06):
        parts.append(box([0.08, height, 0.08], [x, height / 2, depth / 2 - 0.04], color_hex))
        parts.append(box([0.08, height, 0.08], [x, height / 2, -depth / 2 + 0.04], color_hex))


def add_roof_mech(parts: list, width: float, depth: float, y: float):
    anchors = [(-0.22, -0.18), (0.22, -0.12), (0.0, 0.18)]
    for ox, oz in anchors:
        x = ox * width
        z = oz * depth
        parts.append(box([width * 0.17, 0.13, depth * 0.12], [x, y + 0.065, z], "#6f7780"))
        parts.append(box([width * 0.07, 0.07, depth * 0.07], [x, y + 0.16, z], "#b9c1ca"))


def add_balconies(parts: list, width: float, depth: float, floors: int, y_start: float, floor_h: float):
    for f in range(floors):
        y = y_start + f * floor_h + 0.03
        parts.append(box([width * 0.8, 0.03, 0.16], [0, y, depth / 2 + 0.09], "#4a4744"))
        for i in range(6):
            x = -width * 0.36 + i * (width * 0.72 / 5)
            parts.append(box([0.02, 0.11, 0.02], [x, y + 0.06, depth / 2 + 0.15], "#7d7a76"))


def finalize(name: str, parts: list):
    mesh = trimesh.util.concatenate(parts)
    b = mesh.bounds
    mesh.apply_translation([0, -b[0][1], 0])
    (MODELS / name).write_bytes(trimesh.exchange.gltf.export_glb(mesh))


def mine_hq():
    p = []
    p.append(box([1.76, 0.2, 1.38], [0.02, 0.1, 0.0], "#4a4138"))
    p.append(box([1.28, 0.76, 1.0], [-0.05, 0.58, 0.0], "#4f6072"))
    p.append(box([0.95, 0.56, 0.72], [0.22, 1.08, -0.1], "#405264"))
    p.append(box([0.62, 0.38, 0.52], [0.26, 1.54, -0.14], "#334656"))
    p.append(cyl(0.13, 1.25, [-0.56, 0.63, 0.35], "#7f8d99"))
    p.append(cyl(0.13, 1.22, [-0.32, 0.62, 0.35], "#7f8d99"))
    belt = box([0.96, 0.09, 0.17], [0.04, 0.91, 0.35], "#9e6e35")
    rotate(belt, [0, 0, 1], math.radians(-17))
    p.append(belt)
    add_windows_front(p, 1.2, 1.0, floors=2, cols=5, y_bottom=0.22, floor_h=0.2, glass="#7da8ca")
    add_roof_mech(p, 1.28, 1.0, 1.82)
    return p


def hardware_shop():
    p = []
    p.append(box([1.45, 0.16, 1.14], [0, 0.08, 0], "#5f6771"))
    p.append(box([1.16, 0.64, 0.86], [0, 0.48, 0.04], "#667b92"))
    p.append(box([0.52, 0.55, 0.56], [0.58, 0.45, -0.08], "#586d83"))
    p.append(gable(1.24, 0.9, 0.33, [0, 0.83, 0.04], "#354454"))
    p.append(gable(0.58, 0.6, 0.24, [0.58, 0.73, -0.08], "#354454"))
    p.append(box([0.74, 0.07, 0.32], [0.04, 0.44, 0.62], "#5ca4ea"))
    add_windows_front(p, 1.05, 0.86, floors=1, cols=6, y_bottom=0.2, floor_h=0.28, glass="#8cc5ea")
    add_windows_sides(p, 0.86, floors=1, cols=3, y_bottom=0.2, floor_h=0.28, side_x=0.58, glass="#8cc5ea")
    p.append(box([0.22, 0.34, 0.08], [-0.4, 0.17, 0.5], "#2f2a25"))
    return p


def exchange():
    p = []
    p.append(box([1.25, 0.16, 0.98], [0, 0.08, 0], "#65707a"))
    p.append(box([0.96, 0.94, 0.8], [0, 0.55, 0], "#73838d"))
    p.append(box([0.58, 0.78, 0.5], [0.1, 1.35, -0.06], "#62737f"))
    p.append(cyl(0.16, 0.9, [-0.33, 1.1, -0.1], "#52636e"))
    p.append(cyl(0.1, 0.68, [0.35, 1.5, 0.06], "#4a5964"))
    add_windows_front(p, 0.9, 0.8, floors=4, cols=5, y_bottom=0.22, floor_h=0.18, glass="#8ec3de")
    p.append(box([0.7, 0.07, 0.24], [0.0, 0.58, 0.53], "#33c08b"))
    add_roof_mech(p, 0.96, 0.8, 1.96)
    return p


def bank():
    p = []
    p.append(box([1.66, 0.2, 1.3], [0, 0.1, 0], "#9f9683"))
    for i in range(4):
        p.append(box([1.08 - i * 0.08, 0.045, 0.5 - i * 0.05], [0, 0.022 + i * 0.045, 0.5 + i * 0.05], "#b8ae99"))
    p.append(box([1.24, 0.72, 0.92], [0, 0.56, -0.04], "#d0c2aa"))
    for i in range(6):
        x = -0.5 + i * 0.2
        p.append(cyl(0.045, 0.52, [x, 0.36, 0.42], "#e0d8c8", sections=16))
    p.append(box([0.9, 0.09, 0.3], [0, 0.67, 0.42], "#b7aa91"))
    p.append(gable(0.94, 0.3, 0.22, [0, 0.71, 0.42], "#a09075"))
    p.append(box([0.44, 0.9, 0.32], [0, 1.16, -0.3], "#d4c6af"))
    p.append(gable(0.5, 0.36, 0.22, [0, 1.62, -0.3], "#a09075"))
    add_windows_front(p, 1.0, 0.92, floors=2, cols=5, y_bottom=0.24, floor_h=0.2, glass="#98b9ce")
    return p


def diner():
    p = []
    p.append(box([1.3, 0.15, 1.02], [0, 0.075, 0], "#7f534c"))
    p.append(box([1.1, 0.58, 0.84], [0, 0.41, 0], "#93483f"))
    p.append(cyl(0.18, 0.58, [-0.55, 0.41, 0], "#93483f"))
    p.append(cyl(0.18, 0.58, [0.55, 0.41, 0], "#93483f"))
    p.append(box([1.12, 0.08, 0.9], [0, 0.74, 0], "#5b2c2c"))
    p.append(box([0.92, 0.06, 0.34], [0, 0.46, 0.58], "#ea6a5d"))
    add_windows_front(p, 0.98, 0.84, floors=1, cols=6, y_bottom=0.2, floor_h=0.26, glass="#a3d6ec")
    p.append(box([0.2, 0.32, 0.08], [0, 0.16, 0.51], "#2b2725"))
    return p


def coffee_shop():
    p = []
    p.append(box([1.18, 0.16, 0.96], [0, 0.08, 0], "#6d5847"))
    p.append(box([0.98, 0.5, 0.78], [0, 0.36, 0], "#88715d"))
    p.append(gable(1.05, 0.84, 0.32, [0, 0.62, 0], "#3f352e"))
    p.append(box([0.52, 0.06, 0.32], [0, 0.36, 0.58], "#c99966"))
    p.append(box([0.54, 0.1, 0.42], [0.42, 0.09, 0.44], "#7a654f"))
    for i in range(3):
        x = 0.24 + i * 0.18
        p.append(box([0.03, 0.22, 0.03], [x, 0.2, 0.6], "#4b3f35"))
    add_windows_front(p, 0.9, 0.78, floors=1, cols=4, y_bottom=0.2, floor_h=0.26, glass="#9ccce4")
    p.append(box([0.18, 0.3, 0.08], [-0.22, 0.16, 0.47], "#2e2823"))
    p.append(cyl(0.05, 0.44, [0.3, 0.84, -0.2], "#6c6258"))
    return p


def university():
    p = []
    p.append(box([1.72, 0.18, 1.38], [0, 0.09, 0], "#847c8d"))
    p.append(box([1.2, 0.76, 0.94], [0, 0.56, 0], "#93879d"))
    p.append(box([0.46, 0.66, 0.86], [-0.62, 0.49, 0.02], "#8d8197"))
    p.append(box([0.46, 0.66, 0.86], [0.62, 0.49, 0.02], "#8d8197"))
    p.append(box([0.36, 1.08, 0.34], [0, 1.08, -0.28], "#7f7488"))
    p.append(gable(0.44, 0.4, 0.24, [0, 1.64, -0.28], "#5b4e67"))
    for i in range(4):
        x = -0.3 + i * 0.2
        p.append(cyl(0.038, 0.42, [x, 0.26, 0.47], "#d9d3ca"))
    p.append(box([0.74, 0.08, 0.24], [0, 0.47, 0.47], "#d6d0c6"))
    add_windows_front(p, 1.08, 0.94, floors=3, cols=5, y_bottom=0.24, floor_h=0.2, glass="#93b4d2")
    add_windows_front(p, 0.32, 0.34, floors=4, cols=2, y_bottom=0.5, floor_h=0.2, glass="#a8cae5")
    return p


def hospital():
    p = []
    p.append(box([1.52, 0.18, 1.22], [0, 0.09, 0], "#a5adb8"))
    p.append(box([1.06, 0.74, 0.8], [0, 0.55, 0], "#d4d9df"))
    p.append(box([0.36, 0.7, 1.04], [-0.4, 0.52, 0], "#c8cfd8"))
    p.append(box([0.36, 0.7, 1.04], [0.4, 0.52, 0], "#c8cfd8"))
    p.append(box([0.22, 0.62, 0.22], [0, 0.98, -0.16], "#dce1e7"))
    p.append(box([0.12, 0.46, 0.08], [0, 1.32, -0.16], "#d3454d"))
    p.append(box([0.38, 0.12, 0.08], [0, 1.32, -0.16], "#d3454d"))
    p.append(cyl(0.2, 0.04, [0, 0.92, 0.24], "#b0b7c1", sections=30))
    p.append(box([0.3, 0.02, 0.02], [0, 0.95, 0.24], "#f3f5f7"))
    p.append(box([0.02, 0.02, 0.3], [0, 0.95, 0.24], "#f3f5f7"))
    add_windows_front(p, 1.0, 0.8, floors=3, cols=6, y_bottom=0.24, floor_h=0.2, glass="#a3cade")
    return p


def internet_cafe():
    p = []
    p.append(box([1.26, 0.15, 0.98], [0, 0.075, 0], "#405d67"))
    p.append(box([1.02, 0.62, 0.8], [0, 0.44, 0], "#34535d"))
    roof = box([1.06, 0.12, 0.86], [0.02, 0.84, -0.04], "#1f3139")
    rotate(roof, [1, 0, 0], math.radians(-11))
    p.append(roof)
    p.append(box([0.74, 0.33, 0.08], [0, 0.28, 0.46], "#8ecae7"))
    p.append(box([0.8, 0.06, 0.24], [0, 0.58, 0.52], "#2fd8d4"))
    add_windows_front(p, 0.94, 0.8, floors=2, cols=5, y_bottom=0.2, floor_h=0.2, glass="#8bc8e8")
    p.append(cyl(0.06, 0.42, [-0.34, 0.82, -0.18], "#788a94"))
    p.append(sphere(0.08, [-0.34, 1.06, -0.18], "#3dd4d3", subdivisions=2))
    return p


def casino():
    p = []
    p.append(box([1.66, 0.2, 1.32], [0, 0.1, 0], "#5b2539"))
    p.append(box([1.22, 0.72, 1.0], [0, 0.56, 0], "#6f2d43"))
    p.append(cyl(0.25, 0.92, [-0.48, 0.66, 0.0], "#542137"))
    p.append(cyl(0.25, 0.92, [0.48, 0.66, 0.0], "#542137"))
    canopy = cyl(0.28, 0.9, [0.0, 0.42, 0.66], "#e0a83f", sections=22)
    rotate(canopy, [1, 0, 0], math.radians(90))
    p.append(canopy)
    p.append(box([1.06, 0.09, 0.22], [0, 0.78, 0.53], "#922cb6"))
    add_windows_front(p, 1.08, 1.0, floors=2, cols=6, y_bottom=0.24, floor_h=0.22, glass="#93bbd6")
    add_roof_mech(p, 1.22, 1.0, 1.05)
    return p


def post_office():
    p = []
    p.append(box([1.38, 0.17, 1.06], [0, 0.085, 0], "#7f8895"))
    p.append(box([1.04, 0.6, 0.84], [0, 0.43, -0.02], "#939cab"))
    for i in range(3):
        p.append(box([0.86 - i * 0.07, 0.035, 0.34 - i * 0.04], [0, 0.017 + i * 0.035, 0.43 + i * 0.04], "#a2a9b5"))
    for i in range(4):
        x = -0.32 + i * 0.21
        p.append(cyl(0.045, 0.42, [x, 0.25, 0.4], "#d4d8df"))
    p.append(box([0.72, 0.08, 0.24], [0, 0.49, 0.4], "#4b6cb3"))
    p.append(gable(0.76, 0.24, 0.18, [0, 0.54, 0.4], "#606a78"))
    add_windows_front(p, 0.92, 0.84, floors=2, cols=4, y_bottom=0.22, floor_h=0.2, glass="#8fb8d7")
    return p


def gym():
    p = []
    p.append(box([1.28, 0.16, 1.0], [0, 0.08, 0], "#555f69"))
    p.append(box([1.1, 0.62, 0.84], [0, 0.39, 0], "#5f6873"))
    for i in range(3):
        x = -0.34 + i * 0.34
        tooth = gable(0.28, 0.84, 0.15, [x, 0.72, 0], "#3f4852")
        rotate(tooth, [0, 0, 1], math.radians(-90))
        p.append(tooth)
    p.append(box([0.78, 0.07, 0.25], [0, 0.46, 0.54], "#e8843f"))
    add_windows_front(p, 1.0, 0.84, floors=1, cols=6, y_bottom=0.2, floor_h=0.28, glass="#92bfe0")
    return p


def real_estate():
    p = []
    p.append(box([1.22, 0.15, 0.96], [0, 0.075, 0], "#7f907f"))
    p.append(box([1.0, 0.54, 0.8], [0, 0.39, 0], "#93a594"))
    p.append(gable(1.08, 0.86, 0.26, [0, 0.68, 0], "#4e5e4f"))
    p.append(box([0.6, 0.06, 0.24], [0, 0.36, 0.52], "#4aa866"))
    p.append(box([0.22, 0.33, 0.08], [0.2, 0.16, 0.45], "#322a25"))
    add_windows_front(p, 0.92, 0.8, floors=1, cols=4, y_bottom=0.2, floor_h=0.26, glass="#9cc4de")
    return p


def pet_shop():
    p = []
    p.append(box([1.14, 0.14, 0.92], [0, 0.07, 0], "#9f8079"))
    p.append(box([0.92, 0.5, 0.72], [0, 0.36, 0], "#b48c84"))
    p.append(gable(0.98, 0.76, 0.26, [0, 0.62, 0], "#6a4d48"))
    p.append(box([0.64, 0.06, 0.22], [0, 0.36, 0.47], "#ff8ba7"))
    p.append(cyl(0.11, 0.26, [-0.28, 0.2, 0.34], "#c99b94"))
    p.append(cyl(0.11, 0.26, [0.28, 0.2, 0.34], "#c99b94"))
    add_windows_front(p, 0.84, 0.72, floors=1, cols=3, y_bottom=0.2, floor_h=0.26, glass="#9fcbe3")
    return p


def pawn_shop():
    p = []
    p.append(box([1.1, 0.15, 0.92], [0, 0.075, 0], "#675945"))
    p.append(box([0.92, 0.56, 0.74], [0, 0.41, 0], "#78674f"))
    p.append(box([0.95, 0.06, 0.06], [0, 0.72, 0.37], "#443a2d"))
    p.append(box([0.95, 0.06, 0.06], [0, 0.72, -0.37], "#443a2d"))
    p.append(box([0.06, 0.06, 0.74], [0.47, 0.72, 0], "#443a2d"))
    p.append(box([0.06, 0.06, 0.74], [-0.47, 0.72, 0], "#443a2d"))
    p.append(box([0.56, 0.06, 0.2], [0, 0.38, 0.46], "#d8ab3d"))
    add_windows_front(p, 0.78, 0.74, floors=1, cols=3, y_bottom=0.2, floor_h=0.26, glass="#8fb7d1")
    p.append(box([0.22, 0.32, 0.08], [0, 0.16, 0.42], "#2d2824"))
    return p


def bitcoin_atm():
    p = []
    p.append(box([0.96, 0.15, 0.8], [0, 0.075, 0], "#5f6975"))
    p.append(box([0.72, 0.54, 0.56], [0, 0.38, 0], "#6e7986"))
    roof = box([0.78, 0.11, 0.6], [0, 0.7, 0.0], "#333c47")
    rotate(roof, [1, 0, 0], math.radians(-8))
    p.append(roof)
    p.append(box([0.24, 0.36, 0.2], [0, 0.28, 0.22], "#f6a623"))
    p.append(box([0.17, 0.15, 0.07], [0, 0.33, 0.33], "#1f2630"))
    p.append(cyl(0.05, 0.26, [0.27, 0.68, -0.17], "#707d89"))
    p.append(sphere(0.07, [0.27, 0.83, -0.17], "#f6a623", subdivisions=2))
    return p


def clothing_store():
    p = []
    p.append(box([1.3, 0.16, 1.0], [0, 0.08, 0], "#7f6571"))
    p.append(box([1.08, 0.56, 0.82], [0, 0.4, 0], "#936f7d"))
    p.append(gable(1.14, 0.88, 0.26, [0, 0.7, 0], "#5b4652"))
    p.append(box([0.74, 0.07, 0.27], [0, 0.43, 0.55], "#e89db6"))
    add_windows_front(p, 0.96, 0.82, floors=1, cols=5, y_bottom=0.2, floor_h=0.28, glass="#a5cae0")
    return p


def apartment():
    p = []
    p.append(box([1.24, 0.17, 1.02], [0, 0.085, 0], "#75695f"))
    p.append(box([0.96, 1.34, 0.74], [0, 0.84, -0.06], "#8b7d70"))
    p.append(box([0.54, 0.98, 0.42], [0.24, 1.22, 0.2], "#7c6f62"))
    add_windows_front(p, 0.86, 0.74, floors=6, cols=4, y_bottom=0.24, floor_h=0.2, glass="#a2c3d8")
    add_balconies(p, 0.9, 0.74, floors=5, y_start=0.35, floor_h=0.2)
    p.append(box([0.22, 0.38, 0.08], [-0.22, 0.18, 0.35], "#2d2824"))
    p.append(cyl(0.1, 0.24, [0.28, 1.62, -0.22], "#b6b0a8"))
    return p


def furniture_store():
    p = []
    p.append(box([1.36, 0.17, 1.06], [0, 0.085, 0], "#6e765f"))
    p.append(box([1.12, 0.64, 0.88], [0, 0.49, 0], "#7f8a6e"))
    p.append(box([0.62, 0.48, 0.44], [-0.35, 0.41, 0.28], "#747d63"))
    p.append(box([0.66, 0.07, 0.27], [0, 0.48, 0.58], "#a1bf68"))
    for i in range(3):
        x = -0.31 + i * 0.31
        p.append(gable(0.24, 0.88, 0.14, [x, 0.82, 0], "#4d5642"))
    add_windows_front(p, 1.0, 0.88, floors=1, cols=5, y_bottom=0.22, floor_h=0.28, glass="#97bfd8")
    return p


def garage():
    p = []
    p.append(box([1.1, 0.14, 0.9], [0, 0.07, 0], "#6f747a"))
    p.append(box([0.92, 0.46, 0.72], [0, 0.3, 0], "#7b828b"))
    p.append(gable(0.96, 0.76, 0.2, [0, 0.56, 0], "#4b5057"))
    p.append(box([0.48, 0.3, 0.08], [0, 0.16, 0.37], "#353a42"))
    p.append(box([0.54, 0.04, 0.08], [0, 0.34, 0.38], "#a3afbf"))
    return p


def small_a():
    p = garage()
    p.append(box([0.26, 0.2, 0.22], [0.26, 0.8, -0.1], "#8e7b69"))
    return p


def small_b():
    p = []
    p.append(box([1.02, 0.13, 0.84], [0, 0.065, 0], "#70657b"))
    p.append(box([0.84, 0.52, 0.68], [0, 0.33, 0], "#7c7088"))
    p.append(gable(0.88, 0.72, 0.22, [0, 0.58, 0], "#4d4453"))
    add_windows_front(p, 0.76, 0.68, floors=1, cols=3, y_bottom=0.2, floor_h=0.26, glass="#9fbfdb")
    return p


def small_c():
    p = []
    p.append(box([1.08, 0.13, 0.86], [0, 0.065, 0], "#637682"))
    p.append(box([0.9, 0.54, 0.7], [0, 0.34, 0], "#6a7f8b"))
    p.append(box([0.5, 0.3, 0.34], [0.2, 0.76, -0.06], "#5e7380"))
    p.append(cyl(0.08, 0.2, [0.22, 0.96, -0.15], "#b4bcc6"))
    add_windows_front(p, 0.82, 0.7, floors=1, cols=4, y_bottom=0.2, floor_h=0.26, glass="#a0c6df")
    return p


def small_d():
    p = []
    p.append(box([1.0, 0.13, 0.84], [0, 0.065, 0], "#7f6f62"))
    p.append(box([0.84, 0.5, 0.68], [0, 0.32, 0], "#8b7a6c"))
    p.append(gable(0.88, 0.72, 0.22, [0, 0.56, 0], "#5f4f43"))
    add_windows_front(p, 0.76, 0.68, floors=1, cols=3, y_bottom=0.2, floor_h=0.26, glass="#a1c0d8")
    return p


def tree_round():
    return [
        cyl(0.08, 0.64, [0, 0.32, 0], "#6b4e34"),
        sphere(0.26, [0, 0.66, 0], "#2f7f45", subdivisions=2),
        sphere(0.2, [-0.12, 0.72, 0.06], "#348a4a", subdivisions=1),
        sphere(0.2, [0.12, 0.74, -0.04], "#358d4d", subdivisions=1),
    ]


def tree_tall():
    return [
        cyl(0.07, 0.72, [0, 0.36, 0], "#6b4e34"),
        cone(0.26, 0.5, [0, 0.74, 0], "#2d7740"),
        cone(0.2, 0.4, [0, 1.02, 0], "#348649"),
    ]


def street_lamp():
    p = [
        cyl(0.03, 1.46, [0, 0.73, 0], "#505862", sections=14),
        box([0.28, 0.03, 0.03], [0.13, 1.35, 0], "#464d56"),
        box([0.1, 0.12, 0.1], [0.27, 1.28, 0], "#f4e7b6"),
        box([0.18, 0.04, 0.18], [0, 0.02, 0], "#3f454d"),
    ]
    return p


def bench():
    p = [
        box([0.72, 0.06, 0.22], [0, 0.34, 0], "#8a623f"),
        box([0.72, 0.06, 0.07], [0, 0.56, -0.07], "#8a623f"),
    ]
    for x in (-0.28, 0.28):
        p.append(box([0.05, 0.34, 0.05], [x, 0.17, 0.08], "#4d5158"))
        p.append(box([0.05, 0.34, 0.05], [x, 0.17, -0.08], "#4d5158"))
    return p


def mailbox():
    return [
        box([0.2, 0.42, 0.18], [0, 0.21, 0], "#2f76c2"),
        box([0.24, 0.06, 0.2], [0, 0.45, 0], "#d4dde8"),
    ]


def generic_prop(a: str, b: str):
    return [
        box([0.34, 0.22, 0.34], [0, 0.11, 0], a),
        box([0.2, 0.16, 0.2], [0, 0.3, 0], b),
    ]


def character(shirt: str, pants: str, skin: str, hair: str, accent: str, tall: bool):
    scale = 1.14 if tall else 1.0
    p = []
    p.append(cyl(0.07, 0.54 * scale, [-0.11, 0.33 * scale, 0], pants))
    p.append(cyl(0.07, 0.54 * scale, [0.11, 0.33 * scale, 0], pants))
    p.append(box([0.32, 0.16 * scale, 0.2], [0, 0.61 * scale, 0], tint(pants, 8)))
    p.append(cyl(0.18, 0.52 * scale, [0, 0.95 * scale, 0], shirt))
    p.append(sphere(0.2, [0, 1.23 * scale, 0], shirt, subdivisions=2))
    p.append(cyl(0.05, 0.46 * scale, [-0.26, 0.95 * scale, 0], skin))
    p.append(cyl(0.05, 0.46 * scale, [0.26, 0.95 * scale, 0], skin))
    p.append(sphere(0.165, [0, 1.53 * scale, 0], skin, subdivisions=3))
    p.append(sphere(0.17, [0, 1.58 * scale, -0.02], hair, subdivisions=2))
    p.append(box([0.12, 0.03, 0.06], [0, 1.5 * scale, 0.14], accent))
    p.append(box([0.18, 0.07, 0.26], [-0.11, 0.04 * scale, 0.03], "#1f2124"))
    p.append(box([0.18, 0.07, 0.26], [0.11, 0.04 * scale, 0.03], "#1f2124"))
    return p


def main():
    buildings = {
        "mine_hq.glb": mine_hq,
        "hardware_shop.glb": hardware_shop,
        "exchange.glb": exchange,
        "bank.glb": bank,
        "diner.glb": diner,
        "coffee_shop.glb": coffee_shop,
        "university.glb": university,
        "hospital.glb": hospital,
        "internet_cafe.glb": internet_cafe,
        "casino.glb": casino,
        "post_office.glb": post_office,
        "gym.glb": gym,
        "real_estate_office.glb": real_estate,
        "pet_shop.glb": pet_shop,
        "pawn_shop.glb": pawn_shop,
        "bitcoin_atm.glb": bitcoin_atm,
        "clothing_store.glb": clothing_store,
        "apartment_building.glb": apartment,
        "furniture_store.glb": furniture_store,
        "building-garage.glb": garage,
        "building-small-a.glb": small_a,
        "building-small-b.glb": small_b,
        "building-small-c.glb": small_c,
        "building-small-d.glb": small_d,
    }
    for name, fn in buildings.items():
        finalize(name, fn())
        print(f"generated: {name}")

    finalize("grass-trees.glb", tree_round()); print("generated: grass-trees.glb")
    finalize("grass-trees-tall.glb", tree_tall()); print("generated: grass-trees-tall.glb")
    finalize("street_lamp.glb", street_lamp()); print("generated: street_lamp.glb")
    finalize("park_bench.glb", bench()); print("generated: park_bench.glb")
    finalize("mailbox.glb", mailbox()); print("generated: mailbox.glb")
    finalize("fire_hydrant.glb", generic_prop("#c73833", "#b42420")); print("generated: fire_hydrant.glb")
    finalize("trash_can.glb", generic_prop("#4f5a63", "#6c7b86")); print("generated: trash_can.glb")
    finalize("bus_stop.glb", generic_prop("#4d6a86", "#adc6dd")); print("generated: bus_stop.glb")
    finalize("flower_planter.glb", generic_prop("#8b5e3f", "#58a35f")); print("generated: flower_planter.glb")
    finalize("garden_center.glb", generic_prop("#6f7442", "#8ca45a")); print("generated: garden_center.glb")

    finalize("avatar_player.glb", character("#f2a742", "#334252", "#d7ad86", "#4a3a2d", "#ffd45c", False))
    print("generated: avatar_player.glb")
    finalize("npc_craig.glb", character("#7a2f39", "#2c313a", "#cb9f7b", "#2f2520", "#d84c54", True))
    print("generated: npc_craig.glb")


if __name__ == "__main__":
    main()

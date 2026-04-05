#!/usr/bin/env python3
"""
Batch-generate game assets with TRELLIS.2 on a GPU runtime (for example Google Colab T4).

This script is intended to run where CUDA is available. It writes generated .glb files to
an output directory, one file per manifest entry.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

import requests
from PIL import Image


def _load_manifest(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"Manifest must be a list: {path}")
    for i, row in enumerate(data):
        if not isinstance(row, dict):
            raise ValueError(f"Manifest row {i} must be an object")
        if "file" not in row or "prompt" not in row:
            raise ValueError(f"Manifest row {i} must contain 'file' and 'prompt'")
    return data


def _download_pollinations(prompt: str, dest: Path, seed: int | None) -> None:
    query = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{query}?nologo=true&width=1024&height=1024"
    if seed is not None:
        url = f"{url}&seed={seed}"
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = requests.get(url, timeout=120, headers=headers)
    resp.raise_for_status()
    dest.write_bytes(resp.content)


def _find_reference_image(images_dir: Path, stem: str) -> Path | None:
    candidates = [
        images_dir / f"{stem}.png",
        images_dir / f"{stem}.jpg",
        images_dir / f"{stem}.jpeg",
        images_dir / f"{stem}.webp",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def _run_generation(
    manifest: list[dict[str, Any]],
    output_dir: Path,
    references_dir: Path,
    input_images_dir: Path | None,
    model_id: str,
    decimation_target: int,
    texture_size: int,
    retry_count: int,
    pause_seconds: float,
    limit: int | None,
    remesh: bool,
    remesh_band: int,
    remesh_project: int,
) -> None:
    os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

    import torch  # noqa: PLC0415
    from trellis2.pipelines import Trellis2ImageTo3DPipeline  # noqa: PLC0415
    import o_voxel  # noqa: PLC0415

    if not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA is not available in this runtime. Use a GPU runtime (for example Colab T4)."
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    references_dir.mkdir(parents=True, exist_ok=True)

    pipeline = Trellis2ImageTo3DPipeline.from_pretrained(model_id)
    pipeline.cuda()

    selected = manifest[:limit] if limit is not None else manifest
    failures: list[str] = []

    for idx, item in enumerate(selected, start=1):
        file_name = item["file"]
        prompt = item["prompt"]
        seed = int(item.get("seed", idx * 97))
        stem = Path(file_name).stem
        out_path = output_dir / file_name
        ref_path = references_dir / f"{stem}.png"

        print(f"[{idx}/{len(selected)}] {file_name}")
        print(f"  prompt: {prompt}")

        if input_images_dir is not None:
            user_img = _find_reference_image(input_images_dir, stem)
            if user_img is not None:
                shutil.copy2(user_img, ref_path)
            else:
                _download_pollinations(prompt, ref_path, seed)
        else:
            _download_pollinations(prompt, ref_path, seed)

        image = Image.open(ref_path).convert("RGB")

        done = False
        last_error = ""
        for attempt in range(1, retry_count + 1):
            try:
                mesh = pipeline.run(image, seed=seed)[0]
                glb = o_voxel.postprocess.to_glb(
                    vertices=mesh.vertices,
                    faces=mesh.faces,
                    attr_volume=mesh.attrs,
                    coords=mesh.coords,
                    attr_layout=mesh.layout,
                    voxel_size=mesh.voxel_size,
                    aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
                    decimation_target=decimation_target,
                    texture_size=texture_size,
                    remesh=remesh,
                    remesh_band=remesh_band,
                    remesh_project=remesh_project,
                    verbose=True,
                )
                glb.export(str(out_path), extension_webp=True)
                print(f"  wrote: {out_path} ({out_path.stat().st_size} bytes)")
                done = True
                break
            except Exception as ex:  # pragma: no cover
                last_error = str(ex)
                print(f"  attempt {attempt}/{retry_count} failed: {last_error}")
                time.sleep(pause_seconds)

        if not done:
            failures.append(f"{file_name}: {last_error}")

    if failures:
        print("\nGeneration completed with failures:")
        for row in failures:
            print(f"  - {row}")
        raise RuntimeError(f"{len(failures)} asset(s) failed")

    print("\nGeneration completed successfully.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch-generate .glb assets using TRELLIS.2")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("scripts/trellis_asset_manifest.json"),
        help="JSON manifest with output files and prompts",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("generated_models"),
        help="Directory for generated .glb files",
    )
    parser.add_argument(
        "--references-dir",
        type=Path,
        default=Path("generated_references"),
        help="Directory for reference images used during generation",
    )
    parser.add_argument(
        "--input-images-dir",
        type=Path,
        default=None,
        help="Optional local reference image directory. If an image is missing, Pollinations is used.",
    )
    parser.add_argument(
        "--model-id",
        type=str,
        default="microsoft/TRELLIS.2-4B",
        help="Hugging Face model id for TRELLIS.2",
    )
    parser.add_argument("--decimation-target", type=int, default=220000)
    parser.add_argument("--texture-size", type=int, default=2048)
    parser.add_argument("--retry-count", type=int, default=2)
    parser.add_argument("--pause-seconds", type=float, default=4.0)
    parser.add_argument(
        "--remesh",
        action="store_true",
        help="Enable remesh step in o_voxel.postprocess.to_glb (heavier dependencies).",
    )
    parser.add_argument("--remesh-band", type=int, default=1)
    parser.add_argument("--remesh-project", type=int, default=0)
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Generate only the first N assets (for test runs)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = _load_manifest(args.manifest)
    _run_generation(
        manifest=manifest,
        output_dir=args.output_dir,
        references_dir=args.references_dir,
        input_images_dir=args.input_images_dir,
        model_id=args.model_id,
        decimation_target=args.decimation_target,
        texture_size=args.texture_size,
        retry_count=args.retry_count,
        pause_seconds=args.pause_seconds,
        limit=args.limit,
        remesh=args.remesh,
        remesh_band=args.remesh_band,
        remesh_project=args.remesh_project,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# TRELLIS.2 Colab Pipeline (No Local NVIDIA Required)

This pipeline generates a full replacement `.glb` set for Satoshi's Dream on a free Colab GPU runtime.

## 1) Open Colab with GPU

1. Open [Google Colab](https://colab.research.google.com/).
2. Runtime -> Change runtime type -> `T4 GPU`.

## 2) Clone TRELLIS.2 and this game repo

```bash
!git clone -b main --recursive https://github.com/microsoft/TRELLIS.2.git
!git clone https://github.com/cclase/satoshis-dream.git
```

## 3) Install TRELLIS.2 dependencies

```bash
%%bash
cd TRELLIS.2
pip install -U pip
pip install -r requirements.txt
pip install -e .
```

If the repo's `requirements.txt` changes upstream, follow the latest official setup steps in the TRELLIS.2 README.

## 4) Generate asset pack

```bash
%%bash
cd satoshis-dream
pip install pillow requests
python scripts/trellis_batch_generate.py \
  --manifest scripts/trellis_asset_manifest.json \
  --output-dir generated_models \
  --references-dir generated_references
```

Optional test run (first 2 assets only):

```bash
!cd satoshis-dream && python scripts/trellis_batch_generate.py --limit 2
```

## 5) Import generated assets into `models/`

```bash
%%bash
cd satoshis-dream
python scripts/import_generated_assets.py \
  --generated-dir generated_models \
  --models-dir models \
  --clean-unused
```

## 6) Package and download

```bash
%%bash
cd satoshis-dream
zip -r generated_models_bundle.zip models generated_models generated_references
```

Then download `generated_models_bundle.zip` from the Colab file browser.

## 7) Apply in local repo and push to main

After you upload/download the generated files into your local repo:

```bash
python scripts/import_generated_assets.py --generated-dir generated_models --models-dir models --clean-unused
npm test
git add models scripts/trellis_asset_manifest.json scripts/trellis_batch_generate.py scripts/import_generated_assets.py TRELLIS2_COLAB.md
git commit -m "Add TRELLIS.2 Colab batch pipeline and import tooling"
git push origin HEAD:main
```

## Notes

- This pipeline avoids paid API keys.
- Quality depends heavily on prompt + reference image quality.
- For best realism, place curated reference photos into a folder and run with:
  - `--input-images-dir your_reference_images`
  - file names should match manifest stems (e.g. `bank.png`, `diner.jpg`, `avatar_player.png`).

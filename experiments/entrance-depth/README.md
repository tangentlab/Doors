# Winter entrance: first depth experiment

Source: `media/winter/01_Entrance_11-25.mp4`, frame at 10 seconds.
Source video: 3840 × 1920 equirectangular, 63.063 seconds, ~29.97 fps.

DA² (`haodongli/DA-2`) ran locally using Apple MPS in float32. No footage was uploaded.
Model source: https://github.com/EnVision-Research/DA-2
Source revision: d659838585f2bc9967c7e9367af573795271dbbb

Outputs:
- `distance.npy`: 546 × 1092 raw inferred radial distance, relative scale, NOT metres.
- `color.png`: aligned RGB panorama.
- `depth-preview.png`: logarithmic visualization, red near / blue far; clipped at 2nd/98th percentiles for display only.
- `entrance.ply`: 596,232 colored points, binary little-endian PLY, Y-up.
- `points.bin`: 149,058 preview points, interleaved float32 XYZ RGB (RGB 0–1).
- `preview.html`: local interactive WebGL viewer; drag to look and slide sideways.
- `result.json`: model/output metadata.

Preview:
```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory experiments/entrance-depth
```
Open http://127.0.0.1:8766/preview.html . Sideways offsets are fractions of the inferred median distance, not metres.

The current temporary environment, source, and weights are in `/private/tmp/doors-depth-env`, `/private/tmp/doors-da2`, and `/private/tmp/doors-da2-weights`. Temporary files may be removed by the OS; exported artifacts here persist.

Rerun from repository root while those dependencies remain:
```sh
HF_HUB_OFFLINE=1 PYTORCH_ENABLE_MPS_FALLBACK=1 /private/tmp/doors-depth-env/bin/python experiments/entrance-depth/run_depth.py
```
The runner accepts `--repo`, `--weights`, and `--device`. `requirements-lock.txt` records the installed Python 3.13 environment. Only model modules are loaded; upstream training and UI dependencies are not needed.

Validation: all 596,232 depth values are positive and finite; browser preview loads and renders. Depth and RGB share the same pixel grid. This is a single-frame diagnostic, not a completed video conversion or a Gaussian splat. Fine branches lose detail, sky is incorrectly assigned finite geometry, and the tripod remains. Hidden surfaces are absent. Sky/tripod masks and disocclusion handling should precede production integration. The main Doors experience has not been changed.

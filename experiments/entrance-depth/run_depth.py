"""Run official DA-2 locally; export relative radial distance and colored PLY.
Dependencies: torch torchvision einops huggingface_hub safetensors pillow numpy.
DA-2 source: https://github.com/EnVision-Research/DA-2 (Apache-2.0).
"""
import argparse
import json
import sys
import types
from pathlib import Path
import numpy as np
from PIL import Image
import torch

parser = argparse.ArgumentParser()
parser.add_argument('--repo', type=Path, default=Path('/private/tmp/doors-da2'))
parser.add_argument('--weights', type=Path, default=Path('/private/tmp/doors-da2-weights'))
parser.add_argument('--device', default='mps' if torch.backends.mps.is_available() else 'cpu')
args = parser.parse_args()
root = Path(__file__).resolve().parent
# Import the model without the upstream training/Gradio/visualization dependencies.
pkg = types.ModuleType('da2')
pkg.__path__ = [str(args.repo / 'src/da2')]
sys.modules['da2'] = pkg
from da2.model.spherevit import SphereViT
config = json.loads((args.repo / 'configs/infer.json').read_text())
w, h = 1092, 546
config['inference'].update(min_pixels=w*h, max_pixels=w*h)
config['spherevit']['sphere'].update(width=w, height=h)
print(f'Loading DA-2 on {args.device}', flush=True)
model = SphereViT.from_pretrained(str(args.weights), config=config).to(torch.device(args.device)).eval()
rgb = np.array(Image.open(root / 'entrance-10s.png').convert('RGB').resize((w, h), Image.Resampling.LANCZOS))
x = torch.from_numpy(rgb.copy()).permute(2,0,1).float().div(255).unsqueeze(0).to(args.device)
print('Estimating panorama distance...', flush=True)
with torch.inference_mode():
    depth = model(x).squeeze().cpu().numpy()
assert depth.shape == (h,w) and np.isfinite(depth).all() and (depth > 0).all(), 'Invalid model output'
np.save(root / 'distance.npy', depth)
Image.fromarray(rgb).save(root / 'color.png')
# Relative visualization only; raw distance.npy retains model output.
lo, hi = np.percentile(depth, [2,98])
t = np.clip((np.log(depth)-np.log(lo))/(np.log(hi)-np.log(lo)),0,1)
vis = np.stack([1-t, 1-np.abs(2*t-1), t],axis=-1)
Image.fromarray((vis*255).astype('uint8')).save(root / 'depth-preview.png')
# Y-up, longitude zero looks down -Z. Relative scale is NOT calibrated metres.
u, v = np.meshgrid((np.arange(w)+.5)/w, (np.arange(h)+.5)/h)
lon, lat = (u-.5)*2*np.pi, (.5-v)*np.pi
xyz = depth[...,None]*np.stack([np.cos(lat)*np.sin(lon),np.sin(lat),-np.cos(lat)*np.cos(lon)],axis=-1)
vertices = np.empty(w*h,dtype=[('x','<f4'),('y','<f4'),('z','<f4'),('red','u1'),('green','u1'),('blue','u1')])
for i,k in enumerate(['x','y','z']): vertices[k]=xyz[...,i].ravel()
for i,k in enumerate(['red','green','blue']): vertices[k]=rgb[...,i].ravel()
header = 'ply\nformat binary_little_endian 1.0\ncomment DA-2 inferred relative radial distance; not metric\nelement vertex %d\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n' % len(vertices)
with (root/'entrance.ply').open('wb') as f:
    f.write(header.encode()); vertices.tofile(f)
# Compact browser preview, sampled every other pixel.
p = np.concatenate([xyz[::2,::2],rgb[::2,::2]/255],axis=-1).astype('<f4')
p.tofile(root/'points.bin')
metadata = {'model':'haodongli/DA-2','source_frame_seconds':10,'width':w,'height':h,'points':len(vertices),'preview_points':p.size//6,'device':args.device,'distance_min':float(depth.min()),'distance_median':float(np.median(depth)),'distance_max':float(depth.max()),'scale':'relative, not calibrated metres','sky_and_tripod':'unmasked in this first diagnostic export'}
(root/'result.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata,indent=2),flush=True)

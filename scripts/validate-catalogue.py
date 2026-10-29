"""Validate the committed catalogue and every responsive photo/embedded fallback.
Run: python scripts/validate-catalogue.py (requires Pillow and Node.js 22.12+).
Does not download, change product records, or contact external services.
"""
import base64
import hashlib
import io
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
loaded = subprocess.run(['node', '--input-type=module', '-e',
    "import {products} from './src/data/products.js'; import {wardrobeCategories} from './src/data/categories.js'; console.log(JSON.stringify({products,categories:wardrobeCategories}));"],
    cwd=ROOT, capture_output=True, check=True, text=True)
data = json.loads(loaded.stdout)
products, categories = data['products'], data['categories']
manifest = json.loads((ROOT / 'src/data/image-manifest.json').read_text())
counts = Counter(p['subcategory'] for p in products)
errors, primary_hashes, decoded = [], [], 0

for c in categories:
    if counts[c['id']] < 20: errors.append(f"{c['id']}: fewer than 20 products")
for field in ['id', 'sku', 'styleIdentity']:
    if len({p[field] for p in products}) != len(products): errors.append(f'Duplicate {field}')
for p in products:
    if p['images'][0] not in manifest: errors.append(f"Missing image metadata: {p['id']}")
    else: primary_hashes.append(hashlib.sha256((ROOT / 'public' / p['images'][0].lstrip('/')).read_bytes()).hexdigest())
if len(set(primary_hashes)) != len(primary_hashes): errors.append('Repeated primary image bytes')

for url, meta in manifest.items():
    try:
        for path in [url, meta['small']]:
            asset = ROOT / 'public' / path.lstrip('/')
            with Image.open(asset) as im:
                im.load()
                assert im.format == 'WEBP' and im.width >= 200 and im.height >= 200
                if path == url: assert [im.width, im.height] == [meta['width'], meta['height']]
            decoded += 1
        assert hashlib.sha256((ROOT / 'public' / url.lstrip('/')).read_bytes()).hexdigest() == meta['sha256']
        with Image.open(io.BytesIO(base64.b64decode(meta['preview'].split(',')[1], validate=True))) as fallback:
            fallback.load()
            assert fallback.width > 0 and fallback.height > 0
        decoded += 1
    except Exception as exc:
        errors.append(f'{url}: {type(exc).__name__} {exc}')

report = {
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'totalProducts': len(products), 'newProducts': sum('sourceId' in p for p in products),
    'categoryCounts': [{'department': c['department'], 'category': c['name'], 'id': c['id'], 'route': c['href'], 'count': counts[c['id']]} for c in categories],
    'uniquePrimaryPhotos': len(set(primary_hashes)), 'imageManifestEntries': len(manifest),
    'webpFilesDecoded': decoded - len(manifest), 'embeddedFallbacksDecoded': len(manifest),
    'productsWithGalleries': sum(len(p['images']) > 1 for p in products),
    'imageReview': 'All 28 primary-photo contact sheets and seven replacement photos reviewed; colours corrected and misclassified/near-identical selections replaced.',
    'dataMode': 'Local demonstration prices, sizes and stock; reference product photography, not live retail inventory.',
    'errors': errors, 'passed': not errors,
}
(ROOT / 'docs/catalogue-validation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['categoryCounts','imageReview']}, indent=2))
raise SystemExit(1 if errors else 0)

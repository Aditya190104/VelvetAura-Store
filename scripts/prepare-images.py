"""Optional asset refresh: python -m pip install Pillow, then run this script.
Checked-in WebP assets are used by the app; network access is not needed to build.
"""
import concurrent.futures
import io
import json
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    'linen-shirt': 'photo-1598033129183-c4f50c736f10',
    'city-blazer': 'photo-1747814965209-2301e535f209',
    'essential-knit': 'photo-1434389677669-e08b4cac3105',
    'tailored-trousers': 'photo-1473966968600-fa801b869a1a',
    'weekend-shirt': 'photo-1596755094514-f87e34085b2c',
    'evening-dress': 'photo-1595777457583-95e059d581b8',
    'classic-coat': 'photo-1604914509286-abc02036617c',
    'relaxed-tee': 'photo-1521572163474-6864f9cf17ab',
    'denim-jacket': 'photo-1543076447-215ad9ba6923',
    'soft-cardigan': 'photo-1532373179750-cbe69d40161e',
    'summer-dress': 'photo-1515372039744-b8f02a3ae446',
    'daily-denim': 'photo-1542272604-787c3835535d',
    'editorial-hero': 'photo-1625519205691-1b6b7b24622e',
    'editorial-women': 'photo-1559127452-829071a09516',
    'editorial-men': 'photo-1575862469264-0a2e53494cdf',
    'editorial-story': 'photo-1490481651871-ab68de25d43d',
    'editorial-soft': 'photo-1516762689617-e1cffcef479d',
    'editorial-wardrobe': 'photo-1445205170230-053b83016050',
}

def save_webp(image, path, quality):
    # Encode completely before replacing a checked-in asset. An interrupted
    # refresh must not leave the storefront with a zero-byte photograph.
    encoded = io.BytesIO()
    image.save(encoded, 'WEBP', quality=quality, method=6)
    temporary = path.with_suffix('.webp.tmp')
    temporary.write_bytes(encoded.getvalue())
    temporary.replace(path)

def prepare(item):
    name, photo_id = item
    width = 1600 if name == 'editorial-hero' else 1200
    url = 'https://images.unsplash.com/' + photo_id
    data = urllib.request.urlopen(url + f'?auto=format&fit=crop&w={width}&q=86', timeout=35).read()
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
    image.thumbnail((width, 2200))
    path = ROOT / 'public/images' / (name + '.webp')
    save_webp(image, path, quality=83)
    small = image.copy()
    small.thumbnail((480, 880))
    save_webp(small, path.with_name(name + '-small.webp'), quality=79)
    print(name, image.size, flush=True)
    return '/images/' + name + '.webp', {
        'small': '/images/' + name + '-small.webp', 'width': image.width,
        'height': image.height, 'source': url,
    }

if __name__ == '__main__':
    (ROOT / 'public/images').mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = dict(pool.map(prepare, ASSETS.items()))
    (ROOT / 'src/data/image-manifest.json').write_text(json.dumps(results, indent=2) + '\n')
    sources = {
        'description': 'Illustrative stock photography, not physical VelvetAura inventory. Resized and encoded as WebP without content alterations.',
        'provider': 'Unsplash', 'license': 'https://unsplash.com/license', 'images': results,
    }
    (ROOT / 'public/images/sources.json').write_text(json.dumps(sources, indent=2) + '\n')

"""Build a deterministic local catalogue from reviewed candidate records.
Usage: python scripts/build-catalogue.py /absolute/path/to/candidates.json
Requires Pillow. Downloads only selected product imagery; never executes source data.
Prices/stock/sizes are labelled portfolio fixtures, not live retailer inventory.
"""
import argparse,base64,concurrent.futures,hashlib,io,json,re,urllib.request
from pathlib import Path
from PIL import Image,ImageOps

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'public/images/catalogue'
CURATION=json.loads((ROOT/'src/data/catalogue-curation.json').read_text()).get('colors',{})
RANGES={'t-shirts':(399,799),'polo-t-shirts':(599,1199),'casual-shirts':(799,1799),'formal-shirts':(999,1999),'linen-shirts':(1199,2299),'jeans-denim':(999,2499),'trousers-chinos':(899,2299),'shorts':(499,1199),'hoodies-sweatshirts':(899,2499),'jackets-outerwear':(1499,4499),'co-ord-sets':(1199,3499),'ethnic-occasion':(999,3999),'formalwear':(1999,5999),'accessories':(299,1999),'tops':(399,1199),'shirts-blouses':(799,1799),'dresses':(899,2999),'trousers':(899,2299),'skirts':(699,1799),'knitwear':(899,2499),'activewear':(599,1999),'loungewear':(699,1999)}
GROUP={'t-shirts':'Essentials','polo-t-shirts':'Essentials','casual-shirts':'Shirts','formal-shirts':'Shirts','linen-shirts':'Shirts','jeans-denim':'Denim','trousers-chinos':'Trousers','shorts':'Shorts','hoodies-sweatshirts':'Knitwear','jackets-outerwear':'Outerwear','co-ord-sets':'Co-ords','ethnic-occasion':'Ethnic','formalwear':'Tailoring','accessories':'Accessories','tops':'Tops','shirts-blouses':'Shirts','dresses':'Dresses','trousers':'Trousers','skirts':'Skirts','knitwear':'Knitwear','activewear':'Activewear','loungewear':'Loungewear'}
COLORS={'navy-blue':'Navy','off-white':'Ivory','rose-gold':'Rose','sea-green':'Green','olive-green':'Olive','mint-green':'Mint','charcoal-grey':'Charcoal','coffee-brown':'Brown','mustard-yellow':'Mustard','pink':'Pink','black':'Black','white':'White','beige':'Beige','blue':'Blue','green':'Green','yellow':'Yellow','orange':'Orange','red':'Red','purple':'Purple','brown':'Brown','grey':'Grey','gray':'Grey','navy':'Navy','maroon':'Maroon','burgundy':'Burgundy','lavender':'Lavender','teal':'Teal','turquoise':'Turquoise','cream':'Cream','khaki':'Khaki','mustard':'Mustard','olive':'Olive','rust':'Rust','peach':'Peach','coral':'Coral','silver':'Silver','gold':'Gold','golden':'Gold','copper':'Copper','bronze':'Bronze','charcoal':'Charcoal','magenta':'Magenta','mauve':'Mauve','tan':'Tan','taupe':'Taupe','fuchsia':'Pink','violet':'Purple','nude':'Beige'}

def atomic(path, data):
 tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_bytes(data);tmp.replace(path)

def encode(image, width, quality):
 im=image.copy();im.thumbnail((width,round(width*1.5)))
 out=io.BytesIO();im.save(out,'WEBP',quality=quality,method=5)
 return im,out.getvalue()

def photograph(record,index=0):
 source=record['sourceImages'][index]
 if not source.startswith('https://assets.myntassets.com/assets/images/'):raise ValueError('Unapproved image source')
 name=record['sourceId']+(f'-{index+1}' if index else '')
 large=ASSETS/(name+'.webp');small=ASSETS/(name+'-small.webp')
 if large.exists() and large.stat().st_size and small.exists() and small.stat().st_size:
  image=Image.open(large).convert('RGB');image.load()
 else:
  req=urllib.request.Request(source,headers={'User-Agent':'VelvetAuraPortfolioAssetImporter/1.0'})
  with urllib.request.urlopen(req,timeout=25) as r:data=r.read(12*1024*1024)
  image=ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB');image.load()
  if image.width<240 or image.height<240:raise ValueError('Image too small')
  image,encoded=encode(image,800,80);atomic(large,encoded)
  _,encoded=encode(image,360,76);atomic(small,encoded)
 preview,bits=encode(image,40,35)
 checksum=hashlib.sha256(large.read_bytes()).hexdigest()
 return '/images/catalogue/'+name+'.webp',{'small':'/images/catalogue/'+name+'-small.webp','smallWidth':360,'width':image.width,'height':image.height,'preview':'data:image/webp;base64,'+base64.b64encode(bits).decode(),'source':source,'sha256':checksum}

def make_product(row,number,images):
 department,slug=row['subcategory'].split('-',1);gender=department.title();n=int(row['sourceId'])
 colourMatches=[]
 for token,label in COLORS.items():
  m=re.search(r'\b'+token+r'\b',row['slug'])
  if m:colourMatches.append((m.start(),-len(token),label))
 if not colourMatches:
  filename=re.sub(r'([a-z])([A-Z])',r'\1-\2',row['sourceImages'][0].split('/')[-1]).lower()
  for token,label in COLORS.items():
   m=re.search(r'\b'+token+r'\b',filename)
   if m:colourMatches.append((m.start(),-len(token),label))
 color=sorted(colourMatches)[0][2] if colourMatches else 'As shown'
 color=CURATION.get(row['sourceId'],color)
 if slug=='accessories':sizes=['One size']
 elif 'plus-size' in row['slug']:sizes=['XL','2XL','3XL','4XL','5XL']
 elif slug in ['jeans-denim','trousers-chinos','trousers','shorts']:sizes=['28','30','32','34','36','38'] if gender=='Men' else ['26','28','30','32','34']
 else:sizes=['XS','S','M','L','XL'] if gender=='Women' else ['S','M','L','XL','2XL']
 lo,hi=RANGES[slug];price=row['sourcePrice']
 if not lo<=price<=hi:price=lo+((n%max(1,(hi-lo)//100))*100)
 variants=[{'sku':f'VA-{department[0].upper()}-{row["sourceId"]}-{s.replace(" ","").upper()}','size':s,'color':color,'stock':0 if number%17==0 or (i+number)%7==0 else 4+(n+i)%13} for i,s in enumerate(sizes)]
 name=re.sub(r'\b(Men|Women|Mens|Womens)\b','',row['name'],flags=re.I).strip()
 name=re.sub(r'\s+',' ',name).replace('Night suit','Lounge Set').replace('Night Suit','Lounge Set').replace('Nightsuit','Lounge Set')
 if len(name)<10:name=row['brand']+' '+name
 material='Linen blend' if 'linen' in row['slug'] else 'Cotton' if 'cotton' in row['slug'] else 'Denim' if 'denim' in row['slug'] or slug=='jeans-denim' else 'Knitted fabric' if 'knit' in row['slug'] or slug=='knitwear' else 'See garment label for composition'
 features=[label for token,label in [('oversized','Oversized silhouette'),('slim-fit','Slim fit'),('relaxed','Relaxed fit'),('straight','Straight cut'),('striped','Striped pattern'),('printed','Printed design'),('checked','Check pattern'),('floral','Floral pattern'),('embroidered','Embroidered detailing'),('hooded','Hooded design'),('polo','Polo collar'),('mandarin','Mandarin collar'),('v-neck','V neckline'),('round-neck','Round neckline'),('high-rise','High-rise waist'),('wide-leg','Wide-leg silhouette'),('plus-size','Extended size selection')] if token in row['slug']]
 care='Follow the care label. Wash with similar colours and air dry where permitted. Accessories: wipe gently with a soft dry cloth.' if slug=='accessories' else 'Follow the garment care label. Wash similar colours separately; reshape and air dry where permitted. Seek specialist cleaning for embellished pieces.'
 return {'id':'va-'+row['sourceId'],'sku':f'VA-{department[0].upper()}-{row["sourceId"]}','name':name,'brand':row['brand'],'gender':gender,'category':GROUP[slug],'subcategory':row['subcategory'],'price':price,'priceSource':'portfolio-seed','colors':[color],'sizes':sizes,'variants':variants,'stock':sum(v['stock'] for v in variants),'availability':'in-stock' if any(v['stock'] for v in variants) else 'out-of-stock','images':images,'imageMode':'contain','material':material,'details':features or ['Considered everyday styling','Refer to the size guide before choosing your fit'],'care':care,'description':f'{name} from the {row["brand"]} reference selection. '+('; '.join(features[:3])+'. ' if features else '')+'A considered addition to your everyday wardrobe.','tag':'NEW' if number%5==0 else 'BESTSELLER' if number%7==0 else '', 'trending':number%9==0,'popularity':1000-(number*37)%997,'newness':number,'sourceId':row['sourceId'],'styleIdentity':row['identity'],'sourceCategory':row['sourceCategory'],'searchTerms':slug.replace('-',' '),'inventoryMode':'demo'}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('candidates');args=parser.parse_args()
 pools=json.loads(Path(args.candidates).read_text());ASSETS.mkdir(parents=True,exist_ok=True)
 if 'products' in pools:
  rows=pools['products'];pools={c:[r for r in rows if r['subcategory']==c] for c in sorted(set(r['subcategory'] for r in rows))}
 manifest=json.loads((ROOT/'src/data/image-manifest.json').read_text());catalogue=[];sources=[];failures=[];ids=set();hashes=set();identities=set()
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for category,rows in sorted(pools.items()):
   selected=[];cursor=0
   while len(selected)<20 and cursor<len(rows):
    batch=rows[cursor:cursor+20-len(selected)];cursor+=len(batch)
    futures=[pool.submit(photograph,row) for row in batch]
    for row,future in zip(batch,futures):
     try:
      path,meta=future.result()
      if row['sourceId'] in ids or meta['sha256'] in hashes or row['identity'] in identities:continue
      ids.add(row['sourceId']);hashes.add(meta['sha256']);identities.add(row['identity']);manifest[path]=meta
      gallery=[path]
      for index in range(1,min(3,len(row['sourceImages']))):
       try:
        extra,extraMeta=photograph(row,index)
        if extraMeta['sha256']!=meta['sha256']:gallery.append(extra);manifest[extra]=extraMeta
       except Exception as e:failures.append({'id':row['sourceId'],'image':index,'error':str(e)})
      selected.append(make_product(row,len(catalogue)+len(selected)+1,gallery));sources.append(row)
     except Exception as e:failures.append({'id':row['sourceId'],'error':str(e)});print('Image rejected',row['sourceId'],str(e),flush=True)
   catalogue.extend(selected);print(category,len(selected),'/ 20; total',len(catalogue),flush=True)
 (ROOT/'src/data/catalogue-seed.json').write_text(json.dumps(catalogue,separators=(',',':'))+'\n')
 (ROOT/'src/data/image-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 (ROOT/'public/images/catalogue-sources.json').write_text(json.dumps({'purpose':'Portfolio reference photography; product brands remain attributed. Prices, sizes and stock are demonstration fixtures. No affiliation or sale is represented.','dataset':'https://www.kaggle.com/datasets/ronakbokaria/myntra-products-dataset','supplement':'https://github.com/pazhanir/product-images','products':sources},indent=2)+'\n')
 (ROOT/'docs/catalogue-import-log.json').write_text(json.dumps({'imported':len(catalogue),'counts':{c:sum(p['subcategory']==c for p in catalogue) for c in pools},'rejectedImages':failures},indent=2)+'\n')
 if len(catalogue)!=560:raise SystemExit('Catalogue minimum not met; inspect import log before claiming completion.')
 print('560 distinct records imported. No repeated primary image bytes or source IDs.',flush=True)
if __name__=='__main__':main()

import catalogue from './catalogue-seed.json' with { type: 'json' };
import { productImage } from './media.js';
// Retained for the existing account pages; their wardrobe image is now bundled.
export const photo = () => '/images/editorial-wardrobe.webp';
const legacyProducts = [
 {id:'linen-shirt',name:'The Everyday Linen Shirt',category:'Shirts',gender:'Men',price:1599,image:'photo-1598033129183-c4f50c736f10',colors:['Ivory','Sand'],material:'Breathable linen-cotton blend',tag:'BESTSELLER'},
 {id:'city-blazer',name:'The City Blazer',category:'Outerwear',gender:'Women',price:2999,image:'photo-1591047139829-d91aecb6caea',colors:['Sand','Charcoal'],material:'Structured woven cotton',tag:'NEW'},
 {id:'essential-knit',name:'The Essential Knit',category:'Knitwear',gender:'Women',price:1499,image:'photo-1434389677669-e08b4cac3105',colors:['Oat','Ivory'],material:'Soft cotton knit',tag:'NEW'},
 {id:'tailored-trousers',name:'The Tailored Trouser',category:'Trousers',gender:'Men',price:1799,image:'photo-1473966968600-fa801b869a1a',colors:['Sand','Black'],material:'Cotton twill with a touch of stretch',tag:'BESTSELLER'},
 {id:'weekend-shirt',name:'The Weekend Oxford',category:'Shirts',gender:'Men',price:1299,image:'photo-1596755094514-f87e34085b2c',colors:['White','Blue'],material:'Crisp cotton Oxford',tag:'NEW'},
 {id:'evening-dress',name:'The After Hours Dress',category:'Dresses',gender:'Women',price:2499,image:'photo-1595777457583-95e059d581b8',colors:['Rose','Black'],material:'Fluid viscose blend',tag:'EDITOR’S PICK'},
 {id:'classic-coat',name:'The Heritage Coat',category:'Outerwear',gender:'Women',price:3999,image:'photo-1548624149-f3221b903dca',colors:['Camel','Charcoal'],material:'Warm wool-look woven blend',tag:'BESTSELLER'},
 {id:'relaxed-tee',name:'The Relaxed Cotton Tee',category:'Essentials',gender:'Men',price:599,image:'photo-1521572163474-6864f9cf17ab',colors:['White','Black'],material:'100% cotton jersey',tag:'NEW'},
 {id:'denim-jacket',name:'The Studio Denim Jacket',category:'Outerwear',gender:'Men',price:2499,image:'photo-1576871337632-b9aef4c17ab9',colors:['Indigo','Black'],material:'Substantial cotton denim',tag:'EDITOR’S PICK'},
 {id:'soft-cardigan',name:'The Soft Layer Cardigan',category:'Knitwear',gender:'Women',price:1799,image:'photo-1576566588028-4147f3842f27',colors:['Oat','Sand'],material:'Lightweight cotton blend knit',tag:'NEW'},
 {id:'summer-dress',name:'The Slow Sunday Dress',category:'Dresses',gender:'Women',price:1999,image:'photo-1515372039744-b8f02a3ae446',colors:['Ivory','Sand'],material:'Airy viscose-linen blend',tag:'BESTSELLER'},
 {id:'daily-denim',name:'The Straight-Leg Denim',category:'Trousers',gender:'Women',price:1799,image:'photo-1542272604-787c3835535d',colors:['Indigo','Black'],material:'Classic cotton denim',tag:'NEW'}
].map((p,i)=>({...p,sizes:['XS','S','M','L','XL'],popularity:100-i*7,newness:i,description:`An effortless foundation for a considered wardrobe. ${p.name} combines a refined silhouette with ${p.material.toLowerCase()}, made for the moments between everyday and extraordinary.`,images:[productImage(p.id)]}));
const legacySubcategories = {
  'linen-shirt': 'men-linen-shirts', 'city-blazer': 'women-jackets-outerwear',
  'essential-knit': 'women-knitwear', 'tailored-trousers': 'men-trousers-chinos',
  'weekend-shirt': 'men-casual-shirts', 'evening-dress': 'women-dresses',
  'classic-coat': 'women-jackets-outerwear', 'relaxed-tee': 'men-t-shirts',
  'denim-jacket': 'men-jackets-outerwear', 'soft-cardigan': 'women-knitwear',
  'summer-dress': 'women-dresses', 'daily-denim': 'women-jeans-denim',
};
export const products = [...legacyProducts.map((p, i) => {
  const variants = p.colors.flatMap((color, c) => p.sizes.map((size, s) => ({ sku: `VA-ORIGINAL-${i + 1}-${c}-${size}`, size, color, stock: 8 + (i + s + c) % 9 })));
  return { ...p, sku: `VA-ORIGINAL-${String(i + 1).padStart(3, '0')}`, brand: 'VelvetAura', subcategory: legacySubcategories[p.id], variants, stock: variants.reduce((n, v) => n + v.stock, 0), availability: 'in-stock', inventoryMode: 'demo', priceSource: 'portfolio-seed', trending: i % 3 === 0, details: [p.material, 'An easy, contemporary silhouette'], care: 'Follow the garment care label. Wash gently with similar colours and air dry where permitted.', styleIdentity: p.id };
}), ...catalogue];
export const productById = Object.fromEntries(products.map(p => [p.id, p]));
export const categories = [...new Set(products.map(p => p.category))];
export const colorHex={'As shown':'#b7b0a2',Navy:'#273146',Mint:'#b4c7b7',Beige:'#d7c4ac',Pink:'#d298ae',Green:'#5c7657',Yellow:'#e6c967',Orange:'#cd7845',Red:'#a94343',Purple:'#785f83',Brown:'#715342',Grey:'#8a8983',Maroon:'#6c2d41',Burgundy:'#6e3446',Lavender:'#b9a5c7',Teal:'#3c7e7d',Turquoise:'#52acaa',Cream:'#ece3cd',Khaki:'#a89a70',Mustard:'#bf9b3a',Olive:'#79805d',Rust:'#ab6747',Peach:'#e8b092',Coral:'#d98776',Silver:'#bababc',Gold:'#b39b60',Copper:'#b17b57',Bronze:'#927349',Magenta:'#a25080',Mauve:'#9e7b90',Tan:'#b38d61',Taupe:'#9c9080',Multi:'conic-gradient(#8b7550,#dfc2a4,#607570,#282822,#8b7550)',Ivory:'#eee9dc',Sand:'#c8b597',Charcoal:'#45433f',Oat:'#d8cdb9',Black:'#222',White:'#fff',Blue:'#9cbbd1',Rose:'#af6c70',Camel:'#b38b5e',Indigo:'#40536c'};

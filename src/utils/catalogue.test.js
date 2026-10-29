import test from 'node:test';
import assert from 'node:assert/strict';
import { products, productById, colorHex } from '../data/products.js';
import { wardrobeCategories, categoryById, findCategory } from '../data/categories.js';
import { filterProducts, paginateProducts, addCartItem, stockFor, subtotal } from './shop.js';
import { cleanCart } from './persistence.js';

test('all 28 category routes contain at least 20 independently identified products', () => {
  assert.equal(wardrobeCategories.length, 28);
  for (const c of wardrobeCategories) {
    const group = products.filter(p => p.subcategory === c.id);
    assert.ok(group.length >= 20, `${c.id}: ${group.length}`);
    assert.ok(group.every(p => p.gender === c.department));
    assert.equal(new Set(group.map(p => p.styleIdentity)).size, group.length);
    assert.equal(findCategory(c.department, c.slug), c);
  }
});

test('product, source, primary photo and variant identifiers cannot be duplicated', () => {
  for (const field of ['id', 'sku', 'styleIdentity']) assert.equal(new Set(products.map(p => p[field])).size, products.length, field);
  assert.equal(new Set(products.map(p => p.images[0])).size, products.length);
  const variants = products.flatMap(p => p.variants);
  assert.equal(new Set(variants.map(v => v.sku)).size, variants.length);
  const imported = products.filter(p => p.sourceId);
  assert.equal(new Set(imported.map(p => p.sourceId)).size, 560);
});

test('catalogue pricing, categories, variants and total stock are internally consistent', () => {
  for (const p of products) {
    assert.ok(categoryById[p.subcategory], p.id);
    assert.ok(Number.isInteger(p.price) && p.price > 0 && p.price < 25000, p.id);
    assert.equal(p.oldPrice, undefined, 'No invented markdown reference prices');
    assert.ok(p.sizes.length && p.colors.length && p.images.length && p.details.length && p.care);
    assert.equal(p.variants.length, p.sizes.length * p.colors.length);
    for (const v of p.variants) {
      assert.ok(p.sizes.includes(v.size) && p.colors.includes(v.color), v.sku);
      assert.ok(colorHex[v.color], v.color);
      assert.ok(Number.isInteger(v.stock) && v.stock >= 0, v.sku);
    }
    assert.equal(p.stock, p.variants.reduce((n, v) => n + v.stock, 0), p.id);
    assert.equal(p.availability, p.stock ? 'in-stock' : 'out-of-stock');
  }
});

test('all original product URLs resolve after expansion', () => {
  for (const id of ['linen-shirt','city-blazer','essential-knit','tailored-trousers','weekend-shirt','evening-dress','classic-coat','relaxed-tee','denim-jacket','soft-cardigan','summer-dress','daily-denim']) assert.ok(productById[id]);
});

const fixture = { id: 'variant-shirt', name: 'Woven Shirt', category: 'Shirts', gender: 'Men', price: 1299, sizes: ['S', 'M'], colors: ['Blue', 'White'], variants: [{ size: 'S', color: 'Blue', stock: 2 }, { size: 'M', color: 'Blue', stock: 0 }, { size: 'S', color: 'White', stock: 0 }, { size: 'M', color: 'White', stock: 4 }] };
test('size, colour and availability must match the same variant', () => {
  assert.equal(filterProducts([fixture], { sizes: 'M', colors: 'Blue', availability: 'in' }).length, 0);
  assert.equal(filterProducts([fixture], { sizes: 'M', colors: 'Blue', availability: 'out' }).length, 1);
  assert.equal(filterProducts([fixture], { sizes: ['M'], colors: ['White'], availability: 'in' }).length, 1);
  assert.equal(filterProducts([fixture], { sizes: 'XXXL', availability: 'out' }).length, 0);
});

test('combined catalogue discovery, sorting and page boundaries work on real data', () => {
  const result = filterProducts(products, { gender: 'Men', subcategory: 'men-polo-t-shirts', min: 599, max: 1199, sort: 'low' });
  assert.equal(result.length, 20);
  assert.ok(result.every((p, i) => !i || p.price >= result[i - 1].price));
  assert.ok(filterProducts(products, { q: 'polo cotton' }).length > 0);
  assert.deepEqual(filterProducts(products, { min: 5000, max: 200 }), []);
  assert.equal(filterProducts(products, { max: 'not-a-number' }).length, products.length);
  const sorted = filterProducts(products, { sort: 'new' });
  const first = paginateProducts(sorted, 1), second = paginateProducts(sorted, 2);
  assert.equal(first.items.length, 24);
  assert.equal(second.start, 24);
  assert.ok(first.items.every(p => !second.items.includes(p)));
  assert.equal(paginateProducts(sorted, 999).page, 24);
  assert.equal(paginateProducts(sorted, -7).page, 1);
  assert.deepEqual(paginateProducts([], 7).items, []);
});

test('cart refuses invalid sizes, sold-out variants, fractional quantities and accumulated overstock', () => {
  for (const [size, color, quantity] of [['L','Blue',1], ['M','Blue',1], ['S','Blue',0], ['S','Blue',1.5], ['S','Blue',3]]) assert.ok(addCartItem([], fixture, size, color, quantity).error);
  const first = addCartItem([], fixture, 'S', 'Blue', 1);
  assert.equal(subtotal(first.items), 1299);
  const second = addCartItem(first.items, fixture, 'S', 'Blue', 1);
  assert.equal(subtotal(second.items), 2598);
  assert.ok(addCartItem(second.items, fixture, 'S', 'Blue', 1).error);
  assert.equal(stockFor(fixture, 'M', 'White'), 4);
});

test('persisted bags reprice and clamp to current variant stock, removing unavailable variants', () => {
  const result = cleanCart([{id: fixture.id, size: 'S', color: 'Blue', quantity: 8, price: 1}, {id: fixture.id, size: 'M', color: 'Blue', quantity: 1}], [fixture]);
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 2);
  assert.equal(result[0].price, 1299);
});

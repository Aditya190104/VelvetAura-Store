/** Stable department/category IDs. Existing broad category query links remain valid. */
const define = (department, rows) => rows.map(([slug, name, category, description]) => ({
  id: `${department.toLowerCase()}-${slug}`, slug, name, department, category, description,
  href: `/shop/${department.toLowerCase()}/${slug}`,
}));

export const wardrobeCategories = [
  ...define('Men', [
    ['t-shirts', 'T-shirts', 'Essentials', 'Everyday cotton. Expressive graphics. Easy silhouettes.'],
    ['polo-t-shirts', 'Polo T-shirts', 'Essentials', 'A little structure for the everyday.'],
    ['casual-shirts', 'Casual Shirts', 'Shirts', 'From relaxed checks to effortless overshirts.'],
    ['formal-shirts', 'Formal Shirts', 'Shirts', 'Crisp collars and considered details.'],
    ['linen-shirts', 'Linen Shirts', 'Shirts', 'Light, breathable layers for warmer days.'],
    ['jeans-denim', 'Jeans and Denim', 'Denim', 'Your everyday denim, in a fit that feels right.'],
    ['trousers-chinos', 'Trousers and Chinos', 'Trousers', 'Clean lines. Room to move.'],
    ['shorts', 'Shorts', 'Shorts', 'Easy essentials for off-duty days.'],
    ['hoodies-sweatshirts', 'Hoodies and Sweatshirts', 'Knitwear', 'Soft layers for slower moments.'],
    ['jackets-outerwear', 'Jackets and Outerwear', 'Outerwear', 'The finishing layer, thoughtfully chosen.'],
    ['co-ord-sets', 'Co-ord Sets', 'Co-ords', 'Considered pairings, made to be worn together.'],
    ['ethnic-occasion', 'Ethnic and Occasion Wear', 'Ethnic', 'A modern point of view on celebration.'],
    ['formalwear', 'Formalwear', 'Tailoring', 'Tailoring for the moments that matter.'],
    ['accessories', 'Accessories', 'Accessories', 'Small details. A personal signature.'],
  ]),
  ...define('Women', [
    ['tops', 'Tops', 'Tops', 'An expressive starting point for every outfit.'],
    ['t-shirts', 'T-shirts', 'Essentials', 'The everyday, beautifully uncomplicated.'],
    ['shirts-blouses', 'Shirts and Blouses', 'Shirts', 'Soft shapes and considered collars.'],
    ['dresses', 'Dresses', 'Dresses', 'One piece. Endless possibility.'],
    ['jeans-denim', 'Jeans and Denim', 'Denim', 'Modern fits. Everyday favourites.'],
    ['trousers', 'Trousers', 'Trousers', 'Easy movement and a clean silhouette.'],
    ['skirts', 'Skirts', 'Skirts', 'Fluid lines, structured shapes and everything between.'],
    ['knitwear', 'Knitwear', 'Knitwear', 'Texture, warmth and a softer point of view.'],
    ['jackets-outerwear', 'Jackets and Outerwear', 'Outerwear', 'A considered layer for every forecast.'],
    ['co-ord-sets', 'Co-ord Sets', 'Co-ords', 'Together by design. Individual in expression.'],
    ['ethnic-occasion', 'Ethnic and Occasion Wear', 'Ethnic', 'Craft-inspired pieces for meaningful moments.'],
    ['activewear', 'Activewear', 'Activewear', 'Designed for movement, styled for your day.'],
    ['loungewear', 'Loungewear', 'Loungewear', 'A little more comfort. A slower pace.'],
    ['accessories', 'Accessories', 'Accessories', 'The details that make an outfit yours.'],
  ]),
];
export const departments = ['Women', 'Men'];
export const categoryById = Object.fromEntries(wardrobeCategories.map(c => [c.id, c]));
export const categoriesFor = department => wardrobeCategories.filter(c => c.department === department);
export const findCategory = (department, slug) => wardrobeCategories.find(c => c.department.toLowerCase() === department?.toLowerCase() && c.slug === slug);
export const collectionHref = product => categoryById[product.subcategory]?.href || `/shop?gender=${product.gender}`;

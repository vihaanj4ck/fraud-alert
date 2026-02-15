// Product-specific images from Unsplash (proper product photos)
const img = (id, w = 600, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

const ALL_PRODUCTS = [
  { id: 1, name: "Pro Laptop 15\"", price: 84999, description: "Latest gen processor, 16GB RAM, 512GB SSD. Perfect for work and creativity.", categoryId: "electronics", image: img("1496181133206-80ce9b88a853") },
  { id: 2, name: "Flagship Smartphone", price: 54999, description: "6.7\" AMOLED display, 50MP camera, 5000mAh battery.", categoryId: "electronics", image: img("1511707171634-5f897ff02aa9") },
  { id: 3, name: "Wireless Headphones", price: 8999, description: "Active noise cancellation, 30hr battery, premium sound.", categoryId: "electronics", image: img("1505740420928-5e560c06d30e") },
  { id: 4, name: "Smart Watch Pro", price: 12999, description: "Health tracking, GPS, 7-day battery. Stainless steel.", categoryId: "electronics", image: img("1523275335684-37898b6baf30") },
  { id: 5, name: "Bluetooth Speaker", price: 3499, description: "360° sound, IPX7 waterproof, 20hr playtime.", categoryId: "electronics", image: img("1608043152269-423dbba4e7e1") },
  { id: 6, name: "Running Shoes", price: 5999, description: "Lightweight cushioning, breathable mesh. Men & Women.", categoryId: "footwear", image: img("1542291026-7eec264c27ff") },
  { id: 7, name: "Classic Sneakers", price: 4499, description: "Everyday comfort, durable sole. Multiple colors.", categoryId: "footwear", image: img("1605348532760-6753d2c43329") },
  { id: 8, name: "Leather Wallet", price: 2499, description: "Genuine leather, RFID blocking. Bifold design.", categoryId: "accessories", image: img("1627123424574-724758594e93") },
  { id: 9, name: "Designer Sunglasses", price: 3999, description: "UV400 protection, polarised. Metal frame.", categoryId: "accessories", image: img("1572635196237-14b3f281503f") },
  { id: 10, name: "Premium Watch", price: 18999, description: "Analog dial, sapphire crystal, leather strap.", categoryId: "accessories", image: img("1524594094713-4365cf72d58c") },
  { id: 11, name: "Cotton T-Shirt", price: 999, description: "100% organic cotton. Relaxed fit. Multiple colors.", categoryId: "fashion", image: img("1521572163474-6864f9cf17ab") },
  { id: 12, name: "Slim Fit Jeans", price: 2299, description: "Stretch denim, modern cut. Machine washable.", categoryId: "fashion", image: img("1541099649105-f69ad21f3246") },
  { id: 13, name: "Backpack 25L", price: 2799, description: "Laptop sleeve, water-resistant. Ergonomic straps.", categoryId: "accessories", image: img("1553062407-98eeb64c6a62") },
  { id: 14, name: "Yoga Mat 6mm", price: 1299, description: "Non-slip, eco-friendly TPE. Includes carry strap.", categoryId: "sports", image: img("1601925260368-ae2f83cf8b7d") },
  { id: 15, name: "Water Bottle 1L", price: 799, description: "Stainless steel, BPA-free. Keeps cold 24hr.", categoryId: "sports", image: img("1602143407151-7111542de6e8") },
];

export const PRODUCTS_BY_CATEGORY = {
  electronics: ALL_PRODUCTS.filter((p) => p.categoryId === "electronics"),
  fashion: ALL_PRODUCTS.filter((p) => p.categoryId === "fashion"),
  footwear: ALL_PRODUCTS.filter((p) => p.categoryId === "footwear"),
  accessories: ALL_PRODUCTS.filter((p) => p.categoryId === "accessories"),
  sports: ALL_PRODUCTS.filter((p) => p.categoryId === "sports"),
};

export { ALL_PRODUCTS };

export function getProductById(id) {
  return ALL_PRODUCTS.find((p) => p.id === Number(id));
}

export function getProductsByCategory(categoryId) {
  return PRODUCTS_BY_CATEGORY[categoryId] || [];
}

export function getFeaturedProducts() {
  return ALL_PRODUCTS.slice(0, 6);
}

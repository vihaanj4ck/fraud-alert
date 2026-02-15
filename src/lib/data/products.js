// Reliable product images (picsum.photos returns real JPEGs, seed keeps each product stable)
const img = (n) => `https://picsum.photos/seed/product${n}/600/600`;

const ALL_PRODUCTS = [
  { id: 1, name: "Pro Laptop 15\"", price: 84999, description: "Latest gen processor, 16GB RAM, 512GB SSD. Perfect for work and creativity.", categoryId: "electronics", image: img(1) },
  { id: 2, name: "Flagship Smartphone", price: 54999, description: "6.7\" AMOLED display, 50MP camera, 5000mAh battery.", categoryId: "electronics", image: img(2) },
  { id: 3, name: "Wireless Headphones", price: 8999, description: "Active noise cancellation, 30hr battery, premium sound.", categoryId: "electronics", image: img(3) },
  { id: 4, name: "Smart Watch Pro", price: 12999, description: "Health tracking, GPS, 7-day battery. Stainless steel.", categoryId: "electronics", image: img(4) },
  { id: 5, name: "Bluetooth Speaker", price: 3499, description: "360° sound, IPX7 waterproof, 20hr playtime.", categoryId: "electronics", image: img(5) },
  { id: 6, name: "Running Shoes", price: 5999, description: "Lightweight cushioning, breathable mesh. Men & Women.", categoryId: "footwear", image: img(6) },
  { id: 7, name: "Classic Sneakers", price: 4499, description: "Everyday comfort, durable sole. Multiple colors.", categoryId: "footwear", image: img(7) },
  { id: 8, name: "Leather Wallet", price: 2499, description: "Genuine leather, RFID blocking. Bifold design.", categoryId: "accessories", image: img(8) },
  { id: 9, name: "Designer Sunglasses", price: 3999, description: "UV400 protection, polarised. Metal frame.", categoryId: "accessories", image: img(9) },
  { id: 10, name: "Premium Watch", price: 18999, description: "Analog dial, sapphire crystal, leather strap.", categoryId: "accessories", image: img(10) },
  { id: 11, name: "Cotton T-Shirt", price: 999, description: "100% organic cotton. Relaxed fit. Multiple colors.", categoryId: "fashion", image: img(11) },
  { id: 12, name: "Slim Fit Jeans", price: 2299, description: "Stretch denim, modern cut. Machine washable.", categoryId: "fashion", image: img(12) },
  { id: 13, name: "Backpack 25L", price: 2799, description: "Laptop sleeve, water-resistant. Ergonomic straps.", categoryId: "accessories", image: img(13) },
  { id: 14, name: "Yoga Mat 6mm", price: 1299, description: "Non-slip, eco-friendly TPE. Includes carry strap.", categoryId: "sports", image: img(14) },
  { id: 15, name: "Water Bottle 1L", price: 799, description: "Stainless steel, BPA-free. Keeps cold 24hr.", categoryId: "sports", image: img(15) },
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

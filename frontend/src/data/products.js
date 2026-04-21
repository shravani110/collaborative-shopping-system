import applesImage from "../assets/items/apples-optimized.jpg";
import milkImage from "../assets/items/milk-optimized.jpg";
import breadImage from "../assets/items/bread-optimized.jpg";
import eggsImage from "../assets/items/eggs-optimized.jpg";
import riceImage from "../assets/items/rice-optimized.jpg";
import coffeeImage from "../assets/items/coffee-optimized.jpg";
import tomatoesImage from "../assets/items/tomatoes-optimized.jpg";
import bananasImage from "../assets/items/bananas-optimized.jpg";
import biscuitsImage from "../assets/items/biscuits-optimized.jpg";
import yogurtImage from "../assets/items/yougurt-optimized.jpg";

export const productMetaById = {
  apples: { image: applesImage },
  milk: { image: milkImage },
  bread: { image: breadImage },
  eggs: { image: eggsImage },
  rice: { image: riceImage },
  coffee: { image: coffeeImage },
  tomatoes: { image: tomatoesImage },
  bananas: { image: bananasImage },
  biscuits: { image: biscuitsImage },
  yogurt: { image: yogurtImage },
};

export const enrichProducts = (products) =>
  products.map((product) => ({
    ...product,
    ...productMetaById[product.id],
  }));

export const getProductMeta = (productId) => productMetaById[productId] ?? {};

export const fallbackProducts = enrichProducts([
  { id: "apples", name: "Apples", price: 180, unit: "1kg" },
  { id: "milk", name: "Milk", price: 70, unit: "2 packs" },
  { id: "bread", name: "Bread", price: 55, unit: "1 pack" },
  { id: "eggs", name: "Eggs", price: 95, unit: "12 pcs" },
  { id: "rice", name: "Rice", price: 650, unit: "5kg" },
  { id: "coffee", name: "Coffee", price: 320, unit: "250g" },
  { id: "tomatoes", name: "Tomatoes", price: 90, unit: "1kg" },
  { id: "bananas", name: "Bananas", price: 65, unit: "1dozen" },
  { id: "biscuits", name: "Biscuits", price: 45, unit: "1 pack" },
  { id: "yogurt", name: "Yogurt", price: 85, unit: "900gms" },
]);

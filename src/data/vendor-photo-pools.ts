/**
 * Verified Unsplash photo IDs from supplier-product-catalog.ts — one pool per category.
 * Used to add extra vendor gallery shots beyond each SKU's primary photos.
 */
export const CATEGORY_VENDOR_PHOTO_POOLS: Record<string, string[]> = {
  Kitchen: [
    "1556909114-f6e7ad7d7046",
    "1570223532428-b07d03ec5fbc",
    "1556911220-bff31c1d4b38",
    "1602143407151-7111542de6e8",
    "1514431522582-1a3dd4e855dd",
    "1495474476067-e4a5ca78930e",
    "1574253453991-6565d2d1c9c0",
    "1509696810031-3d0f3cb7a3be",
    "1511512578047-dfb367046420",
    "1550745165-9bc0b4bbad21",
    "1556228720-195a672ede8c",
  ],
  Beauty: [
    "1522335780062-3bfff5ca8fb7",
    "1596462502279-8bf88d9e0e19",
    "1570172619644-dfd955fae0e7",
  ],
  "Phone Accessories": [
    "1511707171634-5f897ff02aa9",
    "1601784551446-20c9a0dba0a5",
    "1516035069371-29a1b244cc32",
    "1606983340126-99e4eada64e7",
  ],
  Fitness: [
    "1571019613454-1cb2f99b2d8b",
    "1518611012118-696072aa579a",
    "1544367567-0f2fcb009e0b",
  ],
  Fashion: [
    "1590874103328-dc159ce4f789",
    "1548036328-w9e82e7e79f8",
    "1555041469-a586c61e9bc0",
    "1586023492125-27b2c045efd7",
  ],
  Home: [
    "1558002038-1057907df09bb",
    "1557324232-a38987bb4899",
    "1513506003901-1e6a229e2d15",
    "1513696307739-f1de29a5bfdf",
    "1608571423902-eed4a5ad8108",
    "1603006905003-4692c9f42e63",
    "1553361371-9b22f78e8b1b",
    "1510812431401-41d2bd2722f3",
    "1416879595882-3373a0480b0b",
    "1464226417643-7a49fa0a2f50",
    "1556228720-195a672ede8c",
    "1584622781867-0a690f7919a1",
  ],
  Footwear: [
    "1543163521-1bf539c55dd2",
    "1603487745941-7b5e9c4b1c0e",
  ],
  Automotive: [
    "1449962354373-06deae88ed4e",
    "1492144534655-ae79c964c9d7",
  ],
  Pets: [
    "1583337130417-3346a1be7dee",
    "1548199973-03cce0bbc87b",
  ],
  Gadgets: [
    "1590658268037-6bf3fdad5358",
    "1505740420928-5e560c06d30e",
    "1523275335684-37898b6baf30",
    "1579584425555-c3ce17fd1871",
    "1608043153399-42c4e3e0e3c8",
  ],
  Health: [
    "1544367567-0f2fcb009e0b",
    "1518611012118-696072aa579a",
    "1599901860904-17e6ed70856a",
  ],
  Office: [
    "1586953208448-b0a093f4d667",
    "1487014677367-38c346b808e3",
    "1544161515-4ab6ce6df242",
    "1515377902380-f7e017bc4e1d",
  ],
  Baby: [
    "1523362628745-f0b8f9e2a4a6",
    "1559827260-dc66d52bef19",
    "1515488042361-ee00e3170fab",
    "1555252337-9f89e0d089fc",
  ],
  Outdoor: [
    "1504280390367-361c6d9d38f4",
    "1478139675758-4aeabbb04d30",
  ],
};

export const DEFAULT_VENDOR_PHOTO_POOL =
  CATEGORY_VENDOR_PHOTO_POOLS.Home;

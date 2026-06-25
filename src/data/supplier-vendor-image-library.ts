import type { SupplierPlatform } from "@/services/supplierSourcing";

/**
 * Real supplier listing photos from CJ Dropshipping product feeds (vendor CDN).
 * Used instead of stock photography so Product Finder mirrors TikTok supplier catalogs.
 */
const CJ = {
  blender:
    "https://cf.cjdropshipping.com/quick/product/c1f9aae8-2b96-4ca7-9a67-1441d9596e3d.jpg",
  hoodie:
    "https://cf.cjdropshipping.com/quick/product/a7657750-4318-47e8-875f-b6220ac35354.jpg",
  slippers:
    "https://cf.cjdropshipping.com/38b1ed9d-5913-48aa-bfd6-13af189a64b9.jpg",
  slipperAlt:
    "https://cf.cjdropshipping.com/3d09a008-af9f-4847-bc9d-d58eaf6da82f.jpg",
  homeDecor:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/9c76f4b4-eb7c-4f83-8db5-5881145fead2.jpg",
  shoesBrown:
    "https://cf.cjdropshipping.com/3efbc6e4-9639-4ac7-b698-fd00c3ce2bdb.jpg",
  shoesWhite:
    "https://cf.cjdropshipping.com/051b1a57-268c-44c1-bdd5-512d84567f8c.jpg",
  shoesBlack:
    "https://cf.cjdropshipping.com/8df09154-9628-4324-b3df-81f3e211a1fd.jpg",
  slipperDetail1:
    "https://cf.cjdropshipping.com/17316288/1857336896380997632.jpg",
  slipperDetail2:
    "https://cf.cjdropshipping.com/17316288/1857336897056280576.jpg",
  bagSet:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/57ca0dea-39af-4c54-b4a8-2d0f1a1121b7.jpg",
  organizer:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/fcbbd641-26aa-4e27-ba17-d57a8542de3c.jpg",
  gadgetBundle:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/00e2483-b3b2-4873-80ac-e71f4d760e1f.jpg",
  petToy:
    "https://cf.cjdropshipping.com/15926688/9714688036284.jpg",
  kitchenTool:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/0c42181-d63f-49f9-b6d5-d55574027fcb.jpg",
  accessoryKit:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/1ae2f95-5484-4d30-a93f-64bc740832d2.jpg",
} as const;

export const CATEGORY_VENDOR_IMAGE_POOLS: Record<string, string[]> = {
  Kitchen: [
    CJ.blender,
    CJ.kitchenTool,
    CJ.organizer,
    CJ.homeDecor,
    CJ.gadgetBundle,
  ],
  Beauty: [CJ.slipperDetail1, CJ.slipperDetail2, CJ.bagSet, CJ.slippers],
  "Phone Accessories": [
    CJ.gadgetBundle,
    CJ.accessoryKit,
    CJ.kitchenTool,
    CJ.organizer,
  ],
  Fitness: [CJ.gadgetBundle, CJ.accessoryKit, CJ.hoodie, CJ.kitchenTool],
  Fashion: [CJ.hoodie, CJ.slippers, CJ.slipperAlt, CJ.bagSet],
  Home: [CJ.homeDecor, CJ.organizer, CJ.bagSet, CJ.kitchenTool, CJ.blender],
  Footwear: [
    CJ.slippers,
    CJ.slipperAlt,
    CJ.shoesBrown,
    CJ.shoesWhite,
    CJ.shoesBlack,
    CJ.slipperDetail1,
    CJ.slipperDetail2,
  ],
  Automotive: [CJ.gadgetBundle, CJ.accessoryKit, CJ.organizer],
  Pets: [CJ.petToy, CJ.slippers, CJ.gadgetBundle],
  Gadgets: [CJ.gadgetBundle, CJ.accessoryKit, CJ.kitchenTool, CJ.blender],
  Health: [CJ.slipperDetail1, CJ.gadgetBundle, CJ.kitchenTool],
  Office: [CJ.organizer, CJ.bagSet, CJ.homeDecor, CJ.gadgetBundle],
  Baby: [CJ.bagSet, CJ.organizer, CJ.slippers],
  Outdoor: [CJ.hoodie, CJ.gadgetBundle, CJ.accessoryKit],
};

export const PLATFORM_VENDOR_IMAGE_POOLS: Record<SupplierPlatform, string[]> = {
  cj_dropshipping: Object.values(CJ),
  zendrop: [
    CJ.blender,
    CJ.hoodie,
    CJ.gadgetBundle,
    CJ.homeDecor,
    CJ.slippers,
    CJ.organizer,
  ],
  autods: [
    CJ.accessoryKit,
    CJ.kitchenTool,
    CJ.bagSet,
    CJ.shoesBlack,
    CJ.petToy,
    CJ.slipperDetail2,
  ],
};

export const DEFAULT_VENDOR_IMAGE_POOL: string[] = Object.values(CJ);

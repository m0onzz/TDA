import { normalizeVendorImageUrl } from "@/lib/products/image-cdn";

/**
 * CJ Dropshipping supplier listing photos (square TikTok Shop style).
 * Each profile maps to a product archetype so images match catalog titles.
 */
const CJ = {
  blenderMain:
    "https://cf.cjdropshipping.com/quick/product/c1f9aae8-2b96-4ca7-9a67-1441d9596e3d.jpg",
  blenderAlt:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/0c42181-d63f-49f9-b6d5-d55574027fcb.jpg",
  kitchenTool:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/0c42181-d63f-49f9-b6d5-d55574027fcb.jpg",
  kitchenSet:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/53ce421-33db-4249-8862-f36ad20083b5.jpg",
  slideMain:
    "https://cf.cjdropshipping.com/38b1ed9d-5913-48aa-bfd6-13af189a64b9.jpg",
  slideBlack:
    "https://cf.cjdropshipping.com/3d09a008-af9f-4847-bc9d-d58eaf6da82f.jpg",
  slideBrown:
    "https://cf.cjdropshipping.com/3efbc6e4-9639-4ac7-b698-fd00c3ce2bdb.jpg",
  slideWhite:
    "https://cf.cjdropshipping.com/051b1a57-268c-44c1-bdd5-512d84567f8c.jpg",
  slideDetail1:
    "https://cf.cjdropshipping.com/17316288/1857336896380997632.jpg",
  slideDetail2:
    "https://cf.cjdropshipping.com/17316288/1857336897056280576.jpg",
  slideDetail3:
    "https://cf.cjdropshipping.com/17316288/1857336898192936960.jpg",
  slideDetail4:
    "https://cf.cjdropshipping.com/17316288/1857336900675964928.jpg",
  beautyBag:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/57ca0dea-39af-4c54-b4a8-2d0f1a1121b7.jpg",
  beautyDetail:
    "https://cf.cjdropshipping.com/17316288/1857336901363830784.jpg",
  homeDecor:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/9c76f4b4-eb7c-4f83-8db5-5881145fead2.jpg",
  organizer:
    "https://oss-cf.cjdropshipping.com/product/2024/11/15/08/fcbbd641-26aa-4e27-ba17-d57a8542de3c.jpg",
  gadgetMain:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/00e2483-b3b2-4873-80ac-e71f4d760e1f.jpg",
  gadgetKit:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/1ae2f95-5484-4d30-a93f-64bc740832d2.jpg",
  gadgetBundle:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/245e348-a87b-4196-a3a4-056f6b391301.jpg",
  gadgetPack:
    "https://oss-cf.cjdropshipping.com/product/2025/04/22/01/180af06e-7b7-4662-b975-070203989480.jpg",
  petProduct:
    "https://cf.cjdropshipping.com/15926688/9714688036284.jpg",
  hoodie:
    "https://cf.cjdropshipping.com/quick/product/a7657750-4318-47e8-875f-b6220ac35354.jpg",
  shoeBlack:
    "https://cf.cjdropshipping.com/8df09154-9628-4324-b3df-81f3e211a1fd.jpg",
  slideLifestyle:
    "https://cf.cjdropshipping.com/17316288/1857336902571790336.jpg",
} as const;

function gallery(...urls: string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const normalized = normalizeVendorImageUrl(url);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

/** TikTok-style 1:1 supplier galleries keyed by product archetype. */
export const LISTING_IMAGE_PROFILES = {
  "portable-blender": gallery(
    CJ.blenderMain,
    CJ.blenderAlt,
    CJ.kitchenSet,
    CJ.gadgetMain
  ),
  "vanity-mirror": gallery(
    CJ.beautyBag,
    CJ.beautyDetail,
    CJ.homeDecor,
    CJ.organizer
  ),
  "kitchen-utensils": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.blenderMain,
    CJ.organizer
  ),
  "phone-grip": gallery(
    CJ.gadgetKit,
    CJ.gadgetMain,
    CJ.gadgetBundle,
    CJ.gadgetPack
  ),
  "resistance-bands": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.gadgetMain,
    CJ.gadgetKit
  ),
  "canvas-tote": gallery(
    CJ.beautyBag,
    CJ.hoodie,
    CJ.organizer,
    CJ.homeDecor
  ),
  "security-camera": gallery(
    CJ.gadgetMain,
    CJ.gadgetPack,
    CJ.gadgetBundle,
    CJ.gadgetKit
  ),
  "recovery-slides": gallery(
    CJ.slideMain,
    CJ.slideBlack,
    CJ.slideDetail1,
    CJ.slideDetail2
  ),
  "cup-holder": gallery(
    CJ.gadgetKit,
    CJ.organizer,
    CJ.gadgetMain,
    CJ.slideBrown
  ),
  "sunset-lamp": gallery(
    CJ.homeDecor,
    CJ.gadgetPack,
    CJ.beautyDetail,
    CJ.organizer
  ),
  "ice-roller": gallery(
    CJ.beautyDetail,
    CJ.beautyBag,
    CJ.slideDetail3,
    CJ.organizer
  ),
  "pet-hair-remover": gallery(
    CJ.petProduct,
    CJ.organizer,
    CJ.slideLifestyle,
    CJ.homeDecor
  ),
  "milk-frother": gallery(
    CJ.kitchenTool,
    CJ.blenderMain,
    CJ.kitchenSet,
    CJ.gadgetMain
  ),
  "wireless-earbuds": gallery(
    CJ.gadgetKit,
    CJ.gadgetBundle,
    CJ.gadgetMain,
    CJ.gadgetPack
  ),
  "posture-brace": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.gadgetMain,
    CJ.organizer
  ),
  "oil-diffuser": gallery(
    CJ.homeDecor,
    CJ.organizer,
    CJ.beautyBag,
    CJ.gadgetPack
  ),
  "cable-organizer": gallery(
    CJ.organizer,
    CJ.gadgetPack,
    CJ.gadgetKit,
    CJ.homeDecor
  ),
  "water-bottle": gallery(
    CJ.kitchenSet,
    CJ.blenderMain,
    CJ.gadgetMain,
    CJ.slideWhite
  ),
  "heated-eye-mask": gallery(
    CJ.beautyBag,
    CJ.beautyDetail,
    CJ.slideDetail4,
    CJ.homeDecor
  ),
  "ring-light": gallery(
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.gadgetBundle
  ),
  "baby-feeding": gallery(
    CJ.beautyBag,
    CJ.organizer,
    CJ.kitchenSet,
    CJ.petProduct
  ),
  "cutting-board": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.organizer,
    CJ.blenderMain
  ),
  "jade-roller": gallery(
    CJ.beautyDetail,
    CJ.beautyBag,
    CJ.slideDetail3,
    CJ.organizer
  ),
  "yoga-mat": gallery(
    CJ.hoodie,
    CJ.gadgetBundle,
    CJ.slideLifestyle,
    CJ.gadgetMain
  ),
  "mini-vacuum": gallery(
    CJ.gadgetPack,
    CJ.organizer,
    CJ.gadgetMain,
    CJ.petProduct
  ),
  "smart-watch": gallery(
    CJ.gadgetKit,
    CJ.gadgetBundle,
    CJ.gadgetMain,
    CJ.gadgetPack
  ),
  "led-strip": gallery(
    CJ.gadgetPack,
    CJ.homeDecor,
    CJ.gadgetMain,
    CJ.gadgetBundle
  ),
  "insulated-tumbler": gallery(
    CJ.kitchenTool,
    CJ.kitchenSet,
    CJ.blenderMain,
    CJ.slideWhite
  ),
  "neck-fan": gallery(
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.gadgetBundle,
    CJ.slideBlack
  ),
  "pet-brush": gallery(
    CJ.petProduct,
    CJ.slideLifestyle,
    CJ.organizer,
    CJ.beautyBag
  ),
  "lint-remover": gallery(
    CJ.organizer,
    CJ.beautyBag,
    CJ.homeDecor,
    CJ.petProduct
  ),
  "blue-light-glasses": gallery(
    CJ.gadgetKit,
    CJ.beautyDetail,
    CJ.gadgetMain,
    CJ.beautyBag
  ),
  "bluetooth-speaker": gallery(
    CJ.gadgetBundle,
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.gadgetPack
  ),
  "acupressure-mat": gallery(
    CJ.hoodie,
    CJ.gadgetBundle,
    CJ.homeDecor,
    CJ.slideLifestyle
  ),
  "car-phone-mount": gallery(
    CJ.gadgetKit,
    CJ.gadgetMain,
    CJ.gadgetBundle,
    CJ.slideBrown
  ),
  "knife-sharpener": gallery(
    CJ.kitchenTool,
    CJ.kitchenSet,
    CJ.blenderMain,
    CJ.organizer
  ),
  "closet-organizer": gallery(
    CJ.organizer,
    CJ.beautyBag,
    CJ.homeDecor,
    CJ.hoodie
  ),
  "hair-brush": gallery(
    CJ.beautyDetail,
    CJ.beautyBag,
    CJ.slideDetail4,
    CJ.organizer
  ),
  "camping-hammock": gallery(
    CJ.hoodie,
    CJ.slideLifestyle,
    CJ.homeDecor,
    CJ.gadgetBundle
  ),
  "wine-opener": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.blenderMain,
    CJ.organizer
  ),
  "laptop-stand": gallery(
    CJ.gadgetPack,
    CJ.organizer,
    CJ.gadgetMain,
    CJ.gadgetKit
  ),
  "pilates-bar": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.gadgetMain,
    CJ.slideLifestyle
  ),
  "cabinet-lights": gallery(
    CJ.gadgetPack,
    CJ.homeDecor,
    CJ.gadgetMain,
    CJ.organizer
  ),
  "uv-nail-lamp": gallery(
    CJ.beautyBag,
    CJ.beautyDetail,
    CJ.gadgetPack,
    CJ.organizer
  ),
  "dash-cam": gallery(
    CJ.gadgetMain,
    CJ.gadgetPack,
    CJ.gadgetKit,
    CJ.slideBrown
  ),
  "air-fryer-liners": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.organizer,
    CJ.blenderMain
  ),
  "retro-console": gallery(
    CJ.gadgetBundle,
    CJ.gadgetKit,
    CJ.gadgetMain,
    CJ.gadgetPack
  ),
  "weighted-blanket": gallery(
    CJ.hoodie,
    CJ.homeDecor,
    CJ.organizer,
    CJ.beautyBag
  ),
  "callus-remover": gallery(
    CJ.beautyDetail,
    CJ.slideDetail3,
    CJ.beautyBag,
    CJ.organizer
  ),
  "phone-tripod": gallery(
    CJ.gadgetKit,
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.gadgetBundle
  ),
  "soap-dispenser": gallery(
    CJ.homeDecor,
    CJ.organizer,
    CJ.kitchenTool,
    CJ.gadgetPack
  ),
  "espresso-maker": gallery(
    CJ.kitchenTool,
    CJ.blenderMain,
    CJ.kitchenSet,
    CJ.gadgetMain
  ),
  "drawing-board": gallery(
    CJ.gadgetPack,
    CJ.beautyBag,
    CJ.gadgetMain,
    CJ.petProduct
  ),
  "shoe-covers": gallery(
    CJ.slideBlack,
    CJ.slideMain,
    CJ.shoeBlack,
    CJ.slideDetail1
  ),
  "kitchen-scale": gallery(
    CJ.kitchenTool,
    CJ.kitchenSet,
    CJ.blenderMain,
    CJ.organizer
  ),
  "elbow-brace": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.gadgetMain,
    CJ.organizer
  ),
  "trunk-organizer": gallery(
    CJ.organizer,
    CJ.beautyBag,
    CJ.gadgetPack,
    CJ.slideBrown
  ),
  "toothbrush-holder": gallery(
    CJ.organizer,
    CJ.homeDecor,
    CJ.beautyBag,
    CJ.kitchenTool
  ),
  "spice-jars": gallery(
    CJ.kitchenSet,
    CJ.organizer,
    CJ.kitchenTool,
    CJ.homeDecor
  ),
  "webcam": gallery(
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.gadgetBundle
  ),
  "memory-pillow": gallery(
    CJ.homeDecor,
    CJ.hoodie,
    CJ.beautyBag,
    CJ.organizer
  ),
  "slow-feeder": gallery(
    CJ.petProduct,
    CJ.organizer,
    CJ.kitchenSet,
    CJ.beautyBag
  ),
  "mini-projector": gallery(
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.gadgetBundle,
    CJ.gadgetKit
  ),
  "baking-mat": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.organizer,
    CJ.blenderMain
  ),
  "heated-gloves": gallery(
    CJ.slideBrown,
    CJ.slideBlack,
    CJ.hoodie,
    CJ.shoeBlack
  ),
  "jump-rope": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.gadgetMain,
    CJ.slideLifestyle
  ),
  "shower-head": gallery(
    CJ.homeDecor,
    CJ.organizer,
    CJ.gadgetPack,
    CJ.kitchenTool
  ),
  "camera-lens-kit": gallery(
    CJ.gadgetKit,
    CJ.gadgetMain,
    CJ.gadgetBundle,
    CJ.gadgetPack
  ),
  "pepper-grinder": gallery(
    CJ.kitchenTool,
    CJ.kitchenSet,
    CJ.blenderMain,
    CJ.organizer
  ),
  "sleep-mask": gallery(
    CJ.beautyBag,
    CJ.hoodie,
    CJ.homeDecor,
    CJ.beautyDetail
  ),
  "power-bank": gallery(
    CJ.gadgetKit,
    CJ.gadgetBundle,
    CJ.gadgetMain,
    CJ.gadgetPack
  ),
  "garden-kneeler": gallery(
    CJ.homeDecor,
    CJ.organizer,
    CJ.hoodie,
    CJ.gadgetBundle
  ),
  "lint-roller": gallery(
    CJ.organizer,
    CJ.petProduct,
    CJ.homeDecor,
    CJ.beautyBag
  ),
  "finger-massager": gallery(
    CJ.beautyDetail,
    CJ.gadgetBundle,
    CJ.organizer,
    CJ.beautyBag
  ),
  "lunch-bag": gallery(
    CJ.beautyBag,
    CJ.organizer,
    CJ.kitchenSet,
    CJ.hoodie
  ),
  "wall-bottle-opener": gallery(
    CJ.kitchenTool,
    CJ.kitchenSet,
    CJ.homeDecor,
    CJ.organizer
  ),
  "clothes-steamer": gallery(
    CJ.beautyBag,
    CJ.organizer,
    CJ.hoodie,
    CJ.homeDecor
  ),
  "candle-warmer": gallery(
    CJ.homeDecor,
    CJ.gadgetPack,
    CJ.beautyDetail,
    CJ.organizer
  ),
  "teeth-whitening": gallery(
    CJ.beautyDetail,
    CJ.beautyBag,
    CJ.gadgetPack,
    CJ.organizer
  ),
  "foam-roller": gallery(
    CJ.gadgetBundle,
    CJ.hoodie,
    CJ.slideLifestyle,
    CJ.gadgetMain
  ),
  "sink-colander": gallery(
    CJ.kitchenSet,
    CJ.kitchenTool,
    CJ.organizer,
    CJ.blenderMain
  ),
  "smart-plug": gallery(
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.homeDecor
  ),
  "seat-gap-filler": gallery(
    CJ.gadgetKit,
    CJ.organizer,
    CJ.slideBrown,
    CJ.gadgetMain
  ),
  "herb-garden": gallery(
    CJ.homeDecor,
    CJ.organizer,
    CJ.kitchenSet,
    CJ.gadgetPack
  ),
  "reading-light": gallery(
    CJ.gadgetPack,
    CJ.homeDecor,
    CJ.gadgetMain,
    CJ.organizer
  ),
  "stove-gap-cover": gallery(
    CJ.kitchenSet,
    CJ.organizer,
    CJ.kitchenTool,
    CJ.homeDecor
  ),
  "phone-sanitizer": gallery(
    CJ.gadgetKit,
    CJ.gadgetPack,
    CJ.gadgetMain,
    CJ.beautyBag
  ),
  "general-gadget": gallery(
    CJ.gadgetMain,
    CJ.gadgetKit,
    CJ.gadgetBundle,
    CJ.gadgetPack
  ),
} as const;

export type ListingImageProfileKey = keyof typeof LISTING_IMAGE_PROFILES;

/** Explicit SKU → archetype map so each catalog title gets the right gallery. */
export const PRODUCT_ID_TO_LISTING_PROFILE: Record<string, ListingImageProfileKey> =
  {
    "zd-10021": "portable-blender",
    "ad-88310": "vanity-mirror",
    "zd-44201": "kitchen-utensils",
    "ad-12005": "phone-grip",
    "cj-99102": "resistance-bands",
    "zd-77880": "canvas-tote",
    "zd-33012": "security-camera",
    "ad-55018": "recovery-slides",
    "cj-22044": "cup-holder",
    "ad-77002": "sunset-lamp",
    "zd-66110": "ice-roller",
    "cj-11880": "pet-hair-remover",
    "zd-20101": "milk-frother",
    "ad-30122": "wireless-earbuds",
    "cj-40233": "posture-brace",
    "zd-50344": "oil-diffuser",
    "ad-60455": "cable-organizer",
    "cj-70566": "water-bottle",
    "zd-80677": "heated-eye-mask",
    "ad-90788": "ring-light",
    "cj-10899": "baby-feeding",
    "zd-21010": "cutting-board",
    "ad-32121": "jade-roller",
    "cj-43232": "yoga-mat",
    "zd-54343": "mini-vacuum",
    "ad-65454": "smart-watch",
    "cj-76565": "led-strip",
    "zd-87676": "insulated-tumbler",
    "ad-98787": "neck-fan",
    "cj-19898": "pet-brush",
    "zd-20909": "lint-remover",
    "ad-31010": "blue-light-glasses",
    "cj-42121": "bluetooth-speaker",
    "zd-53232": "acupressure-mat",
    "ad-64343": "car-phone-mount",
    "cj-75454": "knife-sharpener",
    "zd-86565": "closet-organizer",
    "ad-97676": "hair-brush",
    "cj-18787": "camping-hammock",
    "zd-29898": "wine-opener",
    "ad-30909": "laptop-stand",
    "cj-41010": "pilates-bar",
    "zd-52121": "cabinet-lights",
    "ad-63232": "uv-nail-lamp",
    "cj-74343": "dash-cam",
    "zd-85454": "air-fryer-liners",
    "ad-96565": "retro-console",
    "cj-17676": "weighted-blanket",
    "zd-28787": "callus-remover",
    "ad-39898": "phone-tripod",
    "cj-40909": "soap-dispenser",
    "zd-51010": "espresso-maker",
    "ad-62121": "wireless-earbuds",
    "cj-73232": "drawing-board",
    "zd-84343": "shoe-covers",
    "ad-95454": "kitchen-scale",
    "cj-16565": "elbow-brace",
    "zd-27676": "lint-remover",
    "ad-38787": "trunk-organizer",
    "cj-49898": "toothbrush-holder",
    "zd-50909": "spice-jars",
    "ad-61010": "webcam",
    "cj-72121": "memory-pillow",
    "zd-83232": "slow-feeder",
    "ad-94343": "mini-projector",
    "cj-15454": "baking-mat",
    "zd-26565": "cable-organizer",
    "ad-37676": "heated-gloves",
    "cj-48787": "jump-rope",
    "zd-59898": "shower-head",
    "ad-60909": "camera-lens-kit",
    "cj-71010": "pepper-grinder",
    "zd-82121": "sleep-mask",
    "ad-93232": "power-bank",
    "cj-14343": "garden-kneeler",
    "zd-25454": "lint-roller",
    "ad-36565": "finger-massager",
    "cj-47676": "lunch-bag",
    "zd-58787": "wall-bottle-opener",
    "ad-69898": "clothes-steamer",
    "cj-70909": "car-phone-mount",
    "zd-81010": "candle-warmer",
    "ad-92121": "teeth-whitening",
    "cj-13232": "foam-roller",
    "zd-24343": "sink-colander",
    "ad-35454": "smart-plug",
    "cj-46565": "seat-gap-filler",
    "zd-57676": "herb-garden",
    "ad-68787": "reading-light",
    "cj-79898": "stove-gap-cover",
    "zd-80909": "phone-sanitizer",
    "ad-91010": "closet-organizer",
    "cj-12121": "slow-feeder",
  };

const TITLE_PROFILE_RULES: ReadonlyArray<{
  profile: ListingImageProfileKey;
  patterns: readonly RegExp[];
}> = [
  { profile: "portable-blender", patterns: [/portable blender/i] },
  { profile: "recovery-slides", patterns: [/recovery slide/i, /cloud slide/i] },
  { profile: "ring-light", patterns: [/ring light/i] },
  { profile: "vanity-mirror", patterns: [/vanity mirror/i] },
  { profile: "wireless-earbuds", patterns: [/earbud/i] },
  { profile: "insulated-tumbler", patterns: [/tumbler/i, /40oz/i] },
  { profile: "security-camera", patterns: [/security camera/i, /wifi camera/i] },
  { profile: "dash-cam", patterns: [/dash cam/i] },
  { profile: "pet-hair-remover", patterns: [/pet hair remover/i] },
  { profile: "yoga-mat", patterns: [/yoga mat/i] },
  { profile: "led-strip", patterns: [/led strip/i] },
  { profile: "mini-projector", patterns: [/mini projector/i] },
  { profile: "power-bank", patterns: [/portable charger/i, /20000mah/i] },
];

export function resolveListingImageProfileKey(
  productId: string,
  title: string
): ListingImageProfileKey {
  const mapped = PRODUCT_ID_TO_LISTING_PROFILE[productId];
  if (mapped) {
    return mapped;
  }

  for (const rule of TITLE_PROFILE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(title))) {
      return rule.profile;
    }
  }

  return "general-gadget";
}

/** Returns validated CJ supplier URLs for a catalog SKU (TikTok 1:1 listing gallery). */
export function getListingImagesForProduct(
  productId: string,
  title: string,
  imageCount = 4
): string[] {
  const profileKey = resolveListingImageProfileKey(productId, title);
  const profileImages = LISTING_IMAGE_PROFILES[profileKey];

  if (profileImages.length >= imageCount) {
    return [...profileImages].slice(0, imageCount);
  }

  const fallback = LISTING_IMAGE_PROFILES["general-gadget"];
  const merged = gallery(...profileImages, ...fallback);
  return merged.slice(0, imageCount);
}

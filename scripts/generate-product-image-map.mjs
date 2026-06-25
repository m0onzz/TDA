/**
 * One-off helper: prints PRODUCT_ID_TO_LISTING_PROFILE entries from catalog titles.
 * Run: node scripts/generate-product-image-map.mjs
 */
import { readFileSync } from "fs";

const catalog = readFileSync(
  "src/data/supplier-product-catalog.ts",
  "utf8"
);

const products = [];
const blockRe =
  /id:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"/g;
let m;
while ((m = blockRe.exec(catalog)) !== null) {
  if (m[1] === "seed.id") continue;
  products.push({ id: m[1], title: m[2] });
}

/** @type {Array<{ key: string; patterns: RegExp[] }>} */
const RULES = [
  { key: "portable-blender", patterns: [/portable blender/i, /juicer/i] },
  { key: "vanity-mirror", patterns: [/vanity mirror/i, /magnification/i] },
  { key: "kitchen-utensils", patterns: [/utensil set/i, /kitchen utensil/i] },
  { key: "phone-grip", patterns: [/phone grip/i, /magsafe phone grip/i] },
  { key: "resistance-bands", patterns: [/resistance band/i] },
  { key: "canvas-tote", patterns: [/canvas tote/i, /tote bag/i] },
  { key: "security-camera", patterns: [/security camera/i, /wifi camera/i] },
  { key: "recovery-slides", patterns: [/recovery slide/i, /cloud slide/i, /house slide/i] },
  { key: "cup-holder", patterns: [/cup holder/i] },
  { key: "sunset-lamp", patterns: [/sunset lamp/i, /projection light/i] },
  { key: "ice-roller", patterns: [/ice roller/i] },
  { key: "pet-hair-remover", patterns: [/pet hair remover/i, /hair remover roller/i] },
  { key: "milk-frother", patterns: [/milk frother/i] },
  { key: "wireless-earbuds", patterns: [/wireless earbud/i, /sleep earbud/i] },
  { key: "posture-brace", patterns: [/posture corrector/i, /back brace/i] },
  { key: "oil-diffuser", patterns: [/oil diffuser/i, /aromatherapy/i] },
  { key: "cable-organizer", patterns: [/cable organizer/i, /cord organizer/i] },
  { key: "water-bottle", patterns: [/water bottle/i, /collapsible silicone water/i] },
  { key: "heated-eye-mask", patterns: [/heated eye mask/i, /eye mask/i] },
  { key: "ring-light", patterns: [/ring light/i] },
  { key: "baby-feeding", patterns: [/baby feeding/i, /feeding set/i] },
  { key: "cutting-board", patterns: [/cutting board/i] },
  { key: "jade-roller", patterns: [/jade roller/i, /gua sha/i] },
  { key: "yoga-mat", patterns: [/yoga mat/i] },
  { key: "mini-vacuum", patterns: [/mini vacuum/i, /handheld vac/i] },
  { key: "smart-watch", patterns: [/smart watch/i, /fitness tracker/i] },
  { key: "led-strip", patterns: [/led strip/i, /strip light/i] },
  { key: "insulated-tumbler", patterns: [/insulated tumbler/i, /stanley/i, /40oz/i] },
  { key: "neck-fan", patterns: [/neck fan/i] },
  { key: "pet-brush", patterns: [/slicker brush/i, /pet brush/i] },
  { key: "lint-remover", patterns: [/lint remover/i, /fabric shaver/i, /fabric remover/i] },
  { key: "blue-light-glasses", patterns: [/blue light/i, /blocking glasses/i] },
  { key: "bluetooth-speaker", patterns: [/bluetooth speaker/i] },
  { key: "acupressure-mat", patterns: [/acupressure mat/i] },
  { key: "car-phone-mount", patterns: [/car phone mount/i, /bike phone mount/i, /phone mount/i] },
  { key: "knife-sharpener", patterns: [/knife sharpener/i] },
  { key: "closet-organizer", patterns: [/closet organizer/i, /hanging closet/i, /velvet hanger/i] },
  { key: "hair-brush", patterns: [/hair brush/i, /volumizing hair/i] },
  { key: "camping-hammock", patterns: [/hammock/i] },
  { key: "wine-opener", patterns: [/wine opener/i] },
  { key: "laptop-stand", patterns: [/laptop stand/i] },
  { key: "pilates-bar", patterns: [/pilates bar/i] },
  { key: "cabinet-lights", patterns: [/cabinet light/i, /motion sensor/i] },
  { key: "uv-nail-lamp", patterns: [/nail lamp/i, /uv nail/i] },
  { key: "dash-cam", patterns: [/dash cam/i] },
  { key: "air-fryer-liners", patterns: [/air fryer liner/i] },
  { key: "retro-console", patterns: [/game console/i, /retro game/i] },
  { key: "weighted-blanket", patterns: [/weighted blanket/i] },
  { key: "callus-remover", patterns: [/callus remover/i, /pedicure/i] },
  { key: "phone-tripod", patterns: [/phone tripod/i, /foldable phone tripod/i] },
  { key: "soap-dispenser", patterns: [/soap dispenser/i] },
  { key: "espresso-maker", patterns: [/espresso maker/i, /portable espresso/i] },
  { key: "drawing-board", patterns: [/drawing board/i, /led drawing/i] },
  { key: "shoe-covers", patterns: [/shoe cover/i, /rain ready/i] },
  { key: "kitchen-scale", patterns: [/kitchen scale/i, /digital kitchen scale/i] },
  { key: "elbow-brace", patterns: [/elbow brace/i, /tennis elbow/i] },
  { key: "trunk-organizer", patterns: [/trunk organizer/i] },
  { key: "toothbrush-holder", patterns: [/toothbrush holder/i] },
  { key: "spice-jars", patterns: [/spice jar/i, /magnetic spice/i] },
  { key: "webcam", patterns: [/webcam/i, /hd webcam/i] },
  { key: "memory-pillow", patterns: [/memory foam pillow/i, /cooling gel/i] },
  { key: "slow-feeder", patterns: [/slow feeder/i, /puzzle toy/i, /treat puzzle/i] },
  { key: "mini-projector", patterns: [/mini projector/i, /projector 1080/i] },
  { key: "baking-mat", patterns: [/baking mat/i, /silicone baking/i] },
  { key: "heated-gloves", patterns: [/heated glove/i] },
  { key: "jump-rope", patterns: [/jump rope/i] },
  { key: "shower-head", patterns: [/shower head/i] },
  { key: "camera-lens-kit", patterns: [/camera lens kit/i, /lens kit/i] },
  { key: "pepper-grinder", patterns: [/pepper grinder/i] },
  { key: "sleep-mask", patterns: [/sleep mask/i, /blackout sleep/i] },
  { key: "power-bank", patterns: [/portable charger/i, /20000mah/i, /power bank/i] },
  { key: "garden-kneeler", patterns: [/garden kneeler/i, /kneeler seat/i] },
  { key: "lint-roller", patterns: [/lint roller/i] },
  { key: "finger-massager", patterns: [/finger massager/i] },
  { key: "lunch-bag", patterns: [/lunch bag/i, /meal prep carry/i] },
  { key: "wall-bottle-opener", patterns: [/wall-mounted bottle opener/i, /bottle opener/i] },
  { key: "clothes-steamer", patterns: [/steamer for clothes/i, /clothes steamer/i] },
  { key: "candle-warmer", patterns: [/candle warmer/i] },
  { key: "teeth-whitening", patterns: [/teeth whitening/i, /whitening led/i] },
  { key: "foam-roller", patterns: [/foam roller/i] },
  { key: "sink-colander", patterns: [/colander/i, /over-the-sink/i] },
  { key: "smart-plug", patterns: [/smart plug/i] },
  { key: "seat-gap-filler", patterns: [/seat gap/i, /gap filler/i] },
  { key: "herb-garden", patterns: [/herb garden/i, /hydroponic/i] },
  { key: "reading-light", patterns: [/reading light/i, /clip-on reading/i] },
  { key: "stove-gap-cover", patterns: [/stove gap/i] },
  { key: "phone-sanitizer", patterns: [/phone sanitizer/i, /uv phone/i] },
];

function matchProfile(title) {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(title))) {
      return rule.key;
    }
  }
  return "general-gadget";
}

for (const { id, title } of products) {
  const profile = matchProfile(title);
  console.log(`  "${id}": "${profile}", // ${title.split(" — ")[0]}`);
}

console.error(`\nTotal: ${products.length}`);

# Promo batch report: 1002-cast

To: promo-watch assistant

Reviewed `drop.json` and personally viewed all ten supplied JPEGs. The metadata records the five official-account posts below at 2026-10-02 20:00 KST (19:00 Asia/Kuala_Lumpur). The post links were read from the supplied metadata, not independently verified. Although the description mentions red-and-black film posters and billing typography, the actual files are colorful masked portraits and mask close-ups with no printed titles. The gallery copy follows the images.

- https://x.com/IVEstarship/status/2105976329774719310
- https://x.com/IVEstarship/status/2105976287080882604
- https://x.com/IVEstarship/status/2105976253547512140
- https://x.com/IVEstarship/status/2105976213940650274
- https://x.com/IVEstarship/status/2105976172886860247

Added one card per supplied image, ordered as member portrait then matching mask detail for JANGWONYOUNG, LIZ, REI, LEESEO, and ANYUJIN, following the order recorded in the batch context. The cards use the existing gallery-card, image-tag, caption, zoom, and lightbox markup. Member names come from the filenames and batch metadata.

- JANGWONYOUNG: yellow full-length portrait with a pink mask, turquoise gloves and yellow boots; turquoise-gloved hands framing a pearly pink mask on pink. “Golden entrance” / “Behind the pink disguise.”
- LIZ: over-the-shoulder violet portrait against electric blue; a purple sculpted mask held by a magenta glove against blue. “Into the blue” / “Violet in focus.”
- REI: a raised-hand pose with a red mask, pale blue gloves and orange background; a red mask with tiny stars against yellow. “Orange afterglow” / “A scarlet signature.”
- LEESEO: flowing pink sleeves, pink boots and a dramatic magenta-violet silhouette; a metallic pink mask with a diamond detail held against yellow. “Motion in magenta” / “Diamond in the spotlight.”
- ANYUJIN: a close-up with a violet mask and deep facial shadow on pale blue; a white glove holding a lilac mask against pink-lavender. “A gaze through shadow” / “Lavender reveal.”

Placed the new cast collection before the four existing archive cards. Equal-width columns keep each portrait beside its mask on wide screens, collapsing to one column on narrow screens. All ten images preserve their full 800 × 1199 portrait framing with contain sizing. Original archive cards remain in their existing layout.

Scope: only the Visual Archive section of `index.html` and this report changed; supplied batch files, hero, schedule, other sections, styles, and scripts remain unchanged.

Validation: gallery-boundary comparison confirmed all content outside the Visual Archive is byte-for-byte unchanged. All ten new image paths and four retained image paths resolve. Chromium checks passed at 1440px and 390px: all ten new images decoded, preserved their portrait ratio, opened and closed in the lightbox with the correct asset path, and produced no horizontal overflow. Desktop and mobile screenshots were inspected. `git diff --check` passed.

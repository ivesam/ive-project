# Promo batch report: 1004-tracklist

To: promo-watch assistant

Read `drop.json` and personally viewed `1004-tracklist.jpg`. Supplied context records https://x.com/IVEstarship/status/2106700871685861633 at 2026-10-04 20:00 KST; the post itself was not independently fetched.

Added one Visual Archive card titled “Aim for the heart,” tagged “TRACKLIST / OCT 04,” with the caption “Six tracks. One heart-shaped target.” The poster's neon-yellow field, huge hot-pink heart target, orange-and-yellow credit bubbles, black lettering, halftone textures, and six colorful eye masks make a playful comic composition. The six visible songs are Looks Can Kill (TITLE), Mirror Mirror, SNAKESKIN, CRUMBS, Girls Girls Girls, and Glow Motion.

Placed the latest poster before the October 2 cast collection as a centered feature capped at 680px, with a short date label. Its complete 1638 × 2048 composition remains visible through contain sizing and automatic height; the existing lightbox opens the original image for reading the credits. All sixteen prior cards and their ordering remain intact. Used the existing gallery-card markup, caption, tag and zoom design.

Only the Visual Archive section of `index.html` and this report were modified. Hero, schedule, other sections, styles, scripts, prior batches and supplied batch files are unchanged.

Validation: comparison confirms content outside the Visual Archive is byte-for-byte unchanged. Chromium checks passed at 1440px and 390px: seventeen cards, original poster aspect ratio, correct lightbox image and open/close behavior, a feature width no greater than 680px, and no horizontal overflow. Desktop and mobile screenshots were inspected. `git diff --check` passed.

# Promo batch report: 1005-hero-everywhere

To: promo-watch assistant

Read `drop.json` and personally viewed all six supplied JPEGs. Metadata records official-account posts on 2026-10-05 between 20:00 and 20:05 KST; the links were read from the batch, not independently fetched:

- https://x.com/IVEstarship/status/2107064738421362849
- https://x.com/IVEstarship/status/2107064545059729418
- https://x.com/IVEstarship/status/2107064141555073077
- https://x.com/IVEstarship/status/2107063901859000768
- https://x.com/IVEstarship/status/2107063685483213173
- https://x.com/IVEstarship/status/2107063469531074997

The actual images are indigo-purple and pink location maps, each with a colored heart pin and a white-bordered photographic inset. They do not display the LAST SEEN notices or location times described in the metadata, so those claims were not added to gallery captions. Release dates mentioned in the metadata were not used to modify any other section.

Added one card for each location, using names visible in the maps: Cheongdam Park (pink pin, a seated figure with turquoise gloves in a wooded pavilion); Myeong-Dong Culture Park (lilac pin, lavender outfit beside reflective windows); Seoul Children’s Grand Park (green pin, red fruit-shaped swing ride); Dongdaemun History & Culture Park Station (cyan pin, pink gloves beside platform doors); Ttukseom Hangang Park (yellow pin, a caped cyclist by trees); Gwanghwamun (red pin, raised arms and flowing pink ribbons on an open-air vehicle). No member identities were inferred from rear-view or small inset photos.

Placed the new “HERO IN EVERYWHERE / OCT 05” collection before the tracklist, ordered by the location sequence supplied in the batch context. Six numbered tags, place titles and short scene captions follow the existing gallery-card design. The equal-width grid collapses to one column on narrow screens, and contain sizing preserves complete map compositions. All seventeen prior cards and their relative order remain intact; existing lightbox behavior opens each original image.

Only the Visual Archive section of `index.html` and this report were modified. Hero, schedule, other sections, styles, scripts, earlier batches, and supplied files remain unchanged.

Validation: byte-for-byte comparison confirms no changes outside the Visual Archive. Chromium checks passed at 1440px and 390px: twenty-three total cards, all six new images decoding at their original aspect ratios, correct lightbox paths and open/close behavior, and no horizontal overflow. Desktop and mobile screenshots were inspected. `git diff --check` passed.
